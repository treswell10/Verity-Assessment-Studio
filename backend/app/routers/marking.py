"""Start AI marking, confirm/change results, summary, and sign-off."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
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
