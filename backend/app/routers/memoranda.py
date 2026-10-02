"""Upload / extract / edit / confirm a marking memorandum."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Memorandum, MemoQuestion
from ..schemas import MemoQuestionUpdate, MemorandumOut
from ..services.extraction import BlankFileError, UnreadableFileError, extract_text
from ..services.ollama_client import OllamaError, extract_memo_questions

router = APIRouter(prefix="/api/memoranda", tags=["memoranda"])


@router.post("", response_model=MemorandumOut)
async def upload_memorandum(file: UploadFile, db: Session = Depends(get_db)):
    content = await file.read()
    try:
        text = extract_text(file.filename, content)
    except BlankFileError:
        raise HTTPException(status_code=422, detail="No content was found in this file.")
    except UnreadableFileError:
        raise HTTPException(
            status_code=422, detail="We couldn't read this file. Please try another file."
        )

    try:
        extracted = extract_memo_questions(text)
    except OllamaError as exc:
        raise HTTPException(status_code=502, detail=f"Could not extract memo via AI: {exc}")

    memorandum = Memorandum(filename=file.filename, status="draft")
    db.add(memorandum)
    db.flush()  # assign memorandum.id before adding questions

    for i, q in enumerate(extracted):
        db.add(
            MemoQuestion(
                memorandum_id=memorandum.id,
                question_number=str(q.get("question", i + 1)),
                expected_answer=q.get("expected_answer", ""),
                max_mark=float(q.get("max_mark", 0)),
                order=i,
            )
        )
    db.commit()
    db.refresh(memorandum)
    return memorandum


@router.get("/{memorandum_id}", response_model=MemorandumOut)
def get_memorandum(memorandum_id: int, db: Session = Depends(get_db)):
    memorandum = db.get(Memorandum, memorandum_id)
    if memorandum is None:
        raise HTTPException(status_code=404, detail="Memorandum not found")
    return memorandum


@router.patch("/{memorandum_id}/questions/{question_id}", response_model=MemorandumOut)
def update_question(
    memorandum_id: int, question_id: int, update: MemoQuestionUpdate, db: Session = Depends(get_db)
):
    question = db.get(MemoQuestion, question_id)
    if question is None or question.memorandum_id != memorandum_id:
        raise HTTPException(status_code=404, detail="Question not found")

    if update.question_number is not None:
        question.question_number = update.question_number
    if update.expected_answer is not None:
        question.expected_answer = update.expected_answer
    if update.max_mark is not None:
        question.max_mark = update.max_mark

    db.commit()
    memorandum = db.get(Memorandum, memorandum_id)
    return memorandum


@router.patch("/{memorandum_id}", response_model=MemorandumOut)
def confirm_memorandum(memorandum_id: int, db: Session = Depends(get_db)):
    memorandum = db.get(Memorandum, memorandum_id)
    if memorandum is None:
        raise HTTPException(status_code=404, detail="Memorandum not found")
    memorandum.status = "confirmed"
    db.commit()
    db.refresh(memorandum)
    return memorandum
