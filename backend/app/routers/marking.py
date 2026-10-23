"""Start AI marking, confirm/change results, summary, sign-off, marksheet & marked script exports."""
import csv
from datetime import datetime, timezone
import html
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.orm import Session

from ..config import CONFIDENCE_THRESHOLD
from ..database import get_db
from ..models import LearnerScript, MarkingResult, Memorandum
from ..schemas import MarkingResultOut, MarkingResultUpdate, ScriptSummaryOut
from ..services.ollama_client import OllamaError, mark_answer

router = APIRouter(prefix="/api/scripts", tags=["marking"])


@router.post("/{script_id}/mark", response_model=list[MarkingResultOut])
def start_marking(script_id: int, db: Session = Depends(get_db)):
    script = db.get(LearnerScript, script_id)
    if script is None:
        raise HTTPException(status_code=404, detail="Script not found")

    memorandum = db.get(Memorandum, script.memorandum_id)
    answers_by_number = {a.question_number: a.answer_text for a in script.answers}

    results = []
    for question in memorandum.questions:
        learner_answer = answers_by_number.get(question.question_number, "")
        try:
            marked = mark_answer(
                question.question_number, question.expected_answer, question.max_mark, learner_answer
            )
            proposed_mark = float(marked["proposed_mark"])
            reason = str(marked["reason"])
            confidence = float(marked["confidence"])
        except (OllamaError, KeyError, TypeError, ValueError):
            # Per spec.md > Important Failure Modes: malformed/unreachable AI response
            # automatically escalates this question to teacher review.
            proposed_mark = 0
            reason = "AI response could not be parsed — please review manually."
            confidence = 0

        result = MarkingResult(
            script_id=script.id,
            question_number=question.question_number,
            proposed_mark=proposed_mark,
            max_mark=question.max_mark,
            reason=reason,
            confidence=confidence,
            status="proposed",
        )
        db.add(result)
        results.append(result)

    script.status = "marking"
    db.commit()
    for r in results:
        db.refresh(r)
    return results


@router.get("/{script_id}/results", response_model=list[MarkingResultOut])
def get_results(script_id: int, db: Session = Depends(get_db)):
    script = db.get(LearnerScript, script_id)
    if script is None:
        raise HTTPException(status_code=404, detail="Script not found")
    return script.results


@router.patch("/{script_id}/results/{question_number}", response_model=MarkingResultOut)
def update_result(
    script_id: int, question_number: str, update: MarkingResultUpdate, db: Session = Depends(get_db)
):
    result = (
        db.query(MarkingResult)
        .filter(MarkingResult.script_id == script_id, MarkingResult.question_number == question_number)
        .first()
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Marking result not found")

    result.final_mark = update.final_mark
    result.status = update.status
    db.commit()
    db.refresh(result)
    return result


@router.get("/{script_id}/summary", response_model=ScriptSummaryOut)
def get_summary(script_id: int, db: Session = Depends(get_db)):
    script = db.get(LearnerScript, script_id)
    if script is None:
        raise HTTPException(status_code=404, detail="Script not found")

    unresolved = [r.question_number for r in script.results if r.status == "proposed"]
    final_score = sum((r.final_mark if r.final_mark is not None else r.proposed_mark) for r in script.results)
    max_score = sum(r.max_mark for r in script.results)
    percentage = (final_score / max_score * 100) if max_score else 0

    return ScriptSummaryOut(
        final_score=final_score,
        max_score=max_score,
        final_percentage=round(percentage, 1),
        all_reviewed=len(unresolved) == 0,
        unresolved_questions=unresolved,
    )


@router.post("/{script_id}/sign-off")
def sign_off(script_id: int, db: Session = Depends(get_db)):
    script = db.get(LearnerScript, script_id)
    if script is None:
        raise HTTPException(status_code=404, detail="Script not found")

    unresolved = [r.question_number for r in script.results if r.status == "proposed"]
    if unresolved:
        raise HTTPException(
            status_code=409,
            detail={
                "message": f"{len(unresolved)} question(s) still need your review",
                "unresolved_questions": unresolved,
            },
        )

    final_score = sum((r.final_mark if r.final_mark is not None else r.proposed_mark) for r in script.results)
    max_score = sum(r.max_mark for r in script.results)
    percentage = (final_score / max_score * 100) if max_score else 0

    script.status = "finalized"
    script.final_score = final_score
    script.final_percentage = round(percentage, 1)
    script.signed_off_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "status": script.status,
        "final_score": script.final_score,
        "final_percentage": script.final_percentage,
        "signed_off_at": script.signed_off_at.isoformat(),
    }


@router.get("/memorandum/{memorandum_id}/marksheet")
def get_marksheet(memorandum_id: int, db: Session = Depends(get_db)):
    memorandum = db.get(Memorandum, memorandum_id)
    if memorandum is None:
        raise HTTPException(status_code=404, detail="Memorandum not found")

    scripts = (
        db.query(LearnerScript)
        .filter(LearnerScript.memorandum_id == memorandum_id, LearnerScript.status == "finalized")
        .order_by(LearnerScript.signed_off_at.desc(), LearnerScript.id.desc())
        .all()
    )
    max_score = sum(q.max_mark for q in memorandum.questions)
    question_numbers = [q.question_number for q in memorandum.questions]

    rows = []
    for s in scripts:
        marks_by_q = {
            r.question_number: (r.final_mark if r.final_mark is not None else r.proposed_mark)
            for r in s.results
        }
        rows.append(
            {
                "script_id": s.id,
                "filename": s.filename,
                "final_score": s.final_score or 0.0,
                "max_score": max_score,
                "final_percentage": s.final_percentage or 0.0,
                "signed_off_at": s.signed_off_at.isoformat() if s.signed_off_at else None,
                "question_marks": marks_by_q,
            }
        )

    return {
        "memorandum_id": memorandum.id,
        "memorandum_filename": memorandum.filename,
        "max_score": max_score,
        "question_numbers": question_numbers,
        "scripts": rows,
    }


@router.get("/memorandum/{memorandum_id}/marksheet.xlsx")
def download_marksheet_xlsx(memorandum_id: int, db: Session = Depends(get_db)):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter

    data = get_marksheet(memorandum_id, db)
    memorandum = db.get(Memorandum, memorandum_id)
    max_marks_by_q = {q.question_number: q.max_mark for q in memorandum.questions} if memorandum else {}

    wb = Workbook()
    ws = wb.active
    ws.title = "Class Marksheet"
    ws.views.sheetView[0].showGridLines = True

    q_nums = data["question_numbers"]
    total_cols = 1 + len(q_nums) + 4  # Learner Script + Qs + Final Score + Max Score + % + Status + Signed Off
    total_cols = max(total_cols, 6)

    navy_fill = PatternFill("solid", fgColor="1F3350")
    sub_fill = PatternFill("solid", fgColor="F1F5F9")
    header_fill = PatternFill("solid", fgColor="2B4468")
    zebra_fill = PatternFill("solid", fgColor="F8FAFC")
    summary_fill = PatternFill("solid", fgColor="EEF2F6")
    pass_fill = PatternFill("solid", fgColor="DCFCE7")
    review_fill = PatternFill("solid", fgColor="FEF3C7")

    title_font = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
    sub_font = Font(name="Calibri", size=10, italic=True, color="334155")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    bold_navy = Font(name="Calibri", size=11, bold=True, color="1F3350")
    regular_font = Font(name="Calibri", size=11, color="0F172A")
    pass_font = Font(name="Calibri", size=11, bold=True, color="166534")
    review_font = Font(name="Calibri", size=11, bold=True, color="92400E")

    thin_side = Side(style="thin", color="CBD5E1")
    med_bottom = Side(style="medium", color="1F3350")
    cell_border = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
    summary_border = Border(left=thin_side, right=thin_side, top=med_bottom, bottom=med_bottom)

    # Row 1: Title Banner
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=total_cols)
    title_cell = ws.cell(row=1, column=1, value="VERITY ASSESSMENT STUDIO — OFFICIAL CLASS MARKSHEET")
    title_cell.font = title_font
    title_cell.fill = navy_fill
    title_cell.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws.row_dimensions[1].height = 34

    # Row 2: Metadata Banner
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=total_cols)
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    meta_text = (
        f"Memorandum: {data['memorandum_filename']}   |   "
        f"Total Marks: {data['max_score']:g}   |   "
        f"Scripts Marked: {len(data['scripts'])}   |   "
        f"Exported: {now_str}"
    )
    meta_cell = ws.cell(row=2, column=1, value=meta_text)
    meta_cell.font = sub_font
    meta_cell.fill = sub_fill
    meta_cell.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws.row_dimensions[2].height = 22

    ws.row_dimensions[3].height = 10

    # Row 4: Table Headers
    headers = [
        "Learner Script",
        *[f"Q{q} (/{max_marks_by_q.get(q, 0):g})" for q in q_nums],
        "Final Score",
        "Max Marks",
        "Percentage",
        "Signed Off (UTC)",
    ]
    ws.row_dimensions[4].height = 28
    for col_idx, h_text in enumerate(headers, start=1):
        c = ws.cell(row=4, column=col_idx, value=h_text)
        c.font = header_font
        c.fill = header_fill
        c.alignment = Alignment(
            horizontal="left" if col_idx == 1 else "center",
            vertical="center",
            wrap_text=True,
        )
        c.border = cell_border

    # Data Rows
    start_data_row = 5
    for idx, row in enumerate(data["scripts"]):
        r_num = start_data_row + idx
        ws.row_dimensions[r_num].height = 22
        is_zebra = idx % 2 == 1
        row_fill = zebra_fill if is_zebra else PatternFill(fill_type=None)

        signed_str = ""
        if row["signed_off_at"]:
            signed_str = row["signed_off_at"].replace("T", " ")[:16]

        values = [
            row["filename"],
            *[row["question_marks"].get(q, 0) for q in q_nums],
            row["final_score"],
            row["max_score"],
            (row["final_percentage"] or 0.0) / 100.0,
            signed_str,
        ]

        for col_idx, val in enumerate(values, start=1):
            c = ws.cell(row=r_num, column=col_idx, value=val)
            c.border = cell_border
            if row_fill.fill_type:
                c.fill = row_fill

            if col_idx == 1:
                c.font = bold_navy
                c.alignment = Alignment(horizontal="left", vertical="center")
            elif col_idx == len(headers) - 1:  # Percentage column
                c.number_format = "0.0%"
                c.alignment = Alignment(horizontal="center", vertical="center")
                if (row["final_percentage"] or 0) >= 50:
                    c.fill = pass_fill
                    c.font = pass_font
                else:
                    c.fill = review_fill
                    c.font = review_font
            elif col_idx == len(headers) - 3:  # Final Score
                c.font = bold_navy
                c.alignment = Alignment(horizontal="center", vertical="center")
            else:
                c.font = regular_font
                c.alignment = Alignment(horizontal="center", vertical="center")

    # Class Average Row
    if data["scripts"]:
        avg_row = start_data_row + len(data["scripts"])
        ws.row_dimensions[avg_row].height = 24
        ws.cell(row=avg_row, column=1, value="Class Average").font = bold_navy
        ws.cell(row=avg_row, column=1).fill = summary_fill
        ws.cell(row=avg_row, column=1).border = summary_border
        ws.cell(row=avg_row, column=1).alignment = Alignment(horizontal="left", vertical="center")

        n_scripts = len(data["scripts"])
        for i, q in enumerate(q_nums, start=2):
            avg_q = round(sum(s["question_marks"].get(q, 0) for s in data["scripts"]) / n_scripts, 2)
            c = ws.cell(row=avg_row, column=i, value=avg_q)
            c.font = bold_navy
            c.fill = summary_fill
            c.border = summary_border
            c.alignment = Alignment(horizontal="center", vertical="center")

        avg_score = round(sum(s["final_score"] for s in data["scripts"]) / n_scripts, 2)
        avg_pct = sum(s["final_percentage"] for s in data["scripts"]) / n_scripts / 100.0

        score_col = 2 + len(q_nums)
        c_score = ws.cell(row=avg_row, column=score_col, value=avg_score)
        c_score.font = bold_navy
        c_score.fill = summary_fill
        c_score.border = summary_border
        c_score.alignment = Alignment(horizontal="center", vertical="center")

        c_max = ws.cell(row=avg_row, column=score_col + 1, value=data["max_score"])
        c_max.font = bold_navy
        c_max.fill = summary_fill
        c_max.border = summary_border
        c_max.alignment = Alignment(horizontal="center", vertical="center")

        c_pct = ws.cell(row=avg_row, column=score_col + 2, value=avg_pct)
        c_pct.font = bold_navy
        c_pct.fill = summary_fill
        c_pct.border = summary_border
        c_pct.number_format = "0.0%"
        c_pct.alignment = Alignment(horizontal="center", vertical="center")

        c_end = ws.cell(row=avg_row, column=score_col + 3, value="")
        c_end.fill = summary_fill
        c_end.border = summary_border

    # Auto-size columns nicely
    ws.column_dimensions["A"].width = 30
    for col_idx in range(2, len(headers) + 1):
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = 15 if col_idx < len(headers) else 20

    ws.freeze_panes = "A5"

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="Verity-Class-Marksheet-{memorandum_id}.xlsx"'
        },
    )


@router.get("/memorandum/{memorandum_id}/marksheet.csv")
def download_marksheet_csv(memorandum_id: int, db: Session = Depends(get_db)):
    data = get_marksheet(memorandum_id, db)
    output = io.StringIO()
    writer = csv.writer(output)

    q_headers = [f"Q{q}" for q in data["question_numbers"]]
    writer.writerow(
        ["Learner Script", *q_headers, "Final Score", "Max Score", "Percentage (%)", "Signed Off At"]
    )
    for row in data["scripts"]:
        q_vals = [row["question_marks"].get(q, 0) for q in data["question_numbers"]]
        writer.writerow(
            [
                row["filename"],
                *q_vals,
                row["final_score"],
                row["max_score"],
                row["final_percentage"],
                row["signed_off_at"] or "",
            ]
        )

    csv_bytes = output.getvalue().encode("utf-8-sig")
    safe_name = memorandum_id
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="verity-marksheet-{safe_name}.csv"'
        },
    )


@router.get("/{script_id}/download-report")
def download_marked_script(script_id: int, db: Session = Depends(get_db)):
    script = db.get(LearnerScript, script_id)
    if script is None:
        raise HTTPException(status_code=404, detail="Script not found")

    memorandum = db.get(Memorandum, script.memorandum_id)
    expected_by_q = {q.question_number: q.expected_answer for q in memorandum.questions} if memorandum else {}
    answers_by_q = {a.question_number: a.answer_text for a in script.answers}

    total_score = sum((r.final_mark if r.final_mark is not None else r.proposed_mark) for r in script.results)
    max_score = sum(r.max_mark for r in script.results)
    pct = round((total_score / max_score * 100), 1) if max_score else 0.0
    signed_date = (
        script.signed_off_at.strftime("%Y-%m-%d %H:%M UTC")
        if script.signed_off_at
        else "Pending Sign-Off"
    )

    question_cards = []
    for r in script.results:
        awarded = r.final_mark if r.final_mark is not None else r.proposed_mark
        learner_ans = html.escape(answers_by_q.get(r.question_number, "") or "(no answer given)")
        expected_ans = html.escape(expected_by_q.get(r.question_number, ""))
        reason_txt = html.escape(r.reason or "")
        badge_note = "Teacher Adjusted" if r.status == "changed" else "Teacher Confirmed"
        question_cards.append(
            f"""
            <div class="q-card">
              <div class="q-header">
                <span class="q-title">Question {html.escape(r.question_number)}</span>
                <span class="q-mark">{awarded:g} / {r.max_mark:g} marks <small>({badge_note})</small></span>
              </div>
              <div class="grid">
                <div class="box learner">
                  <div class="label">Your Answer</div>
                  <div class="text">{learner_ans}</div>
                </div>
                <div class="box memo">
                  <div class="label">Memorandum / Expected Answer</div>
                  <div class="text">{expected_ans}</div>
                </div>
              </div>
              <div class="feedback">
                <strong>Feedback:</strong> {reason_txt}
              </div>
            </div>
            """
        )

    doc = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Marked Script — {html.escape(script.filename)}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8f7f4; color: #0f172a; margin: 0; padding: 32px 16px; }}
    .container {{ max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px; box-shadow: 0 4px 20px rgba(15,23,42,0.05); }}
    .top {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }}
    h1 {{ margin: 0 0 6px 0; color: #1f3350; font-size: 24px; }}
    .meta {{ color: #64748b; font-size: 13px; }}
    .score-box {{ text-align: right; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px 22px; border-radius: 14px; }}
    .score-num {{ font-size: 28px; font-weight: 800; color: #1f3350; }}
    .score-pct {{ font-size: 14px; font-weight: 700; color: #2f7a4f; }}
    .q-card {{ border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 16px; background: #fcfcfd; page-break-inside: avoid; }}
    .q-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }}
    .q-title {{ font-weight: 700; color: #1f3350; font-size: 15px; }}
    .q-mark {{ font-weight: 700; color: #2f7a4f; background: #ecfdf5; padding: 4px 10px; border-radius: 8px; font-size: 13px; }}
    .q-mark small {{ color: #64748b; font-weight: 500; }}
    .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }}
    .box {{ padding: 12px; border-radius: 10px; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }}
    .learner {{ background: #f8fafc; border: 1px solid #cbd5e1; }}
    .memo {{ background: #f1f5f9; border: 1px solid #e2e8f0; }}
    .label {{ font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 4px; }}
    .feedback {{ font-size: 13px; color: #334155; background: #fff; border-top: 1px solid #e2e8f0; padding-top: 10px; }}
    .print-bar {{ text-align: right; margin-bottom: 16px; max-width: 820px; margin-left: auto; margin-right: auto; }}
    .btn {{ background: #1f3350; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px; }}
    @media print {{ .print-bar {{ display: none; }} body {{ background: #fff; padding: 0; }} .container {{ box-shadow: none; border: none; }} }}
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="container">
    <div class="top">
      <div>
        <h1>Marked Assessment Report</h1>
        <div class="meta">Learner Script: <strong>{html.escape(script.filename)}</strong></div>
        <div class="meta">Memorandum: {html.escape(memorandum.filename if memorandum else "")}</div>
        <div class="meta">Teacher Sign-Off: {signed_date}</div>
      </div>
      <div class="score-box">
        <div class="score-num">{total_score:g} / {max_score:g}</div>
        <div class="score-pct">{pct}% Final Mark</div>
      </div>
    </div>
    {''.join(question_cards)}
  </div>
</body>
</html>"""

    clean_filename = script.filename.rsplit(".", 1)[0]
    return HTMLResponse(
        content=doc,
        headers={
            "Content-Disposition": f'attachment; filename="{clean_filename}-marked-report.html"'
        },
    )
