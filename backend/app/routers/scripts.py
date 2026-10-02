"""Upload and extract a learner's completed assessment script."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import LearnerScript, Memorandum, ScriptAnswer
from ..schemas import LearnerScriptOut
from ..services.extraction import BlankFileError, UnreadableFileError, extract_text
from ..services.ollama_client import OllamaError, split_script_answers

router = APIRouter(prefix="/api/scripts", tags=["scripts"])


@router.post("", response_model=LearnerScriptOut)
async def upload_script(
    memorandum_id: int, file: UploadFile, db: Session = Depends(get_db)
):
    memorandum = db.get(Memorandum, memorandum_id)
    if memorandum is None:
        raise HTTPException(status_code=404, detail="Memorandum not found")
    if memorandum.status != "confirmed":
        raise HTTPException(status_code=409, detail="Memorandum must be confirmed first")

    content = await file.read()
    try:
        text = extract_text(file.filename, content)
    except BlankFileError:
        raise HTTPException(status_code=422, detail="No content was found in this file.")
    except UnreadableFileError:
        raise HTTPException(
            status_code=422, detail="We couldn't read this file. Please try another file."
        )

    question_numbers = [q.question_number for q in memorandum.questions]
    try:
        split = split_script_answers(text, question_numbers)
    except OllamaError as exc:
        raise HTTPException(status_code=502, detail=f"Could not split script via AI: {exc}")

    script = LearnerScript(memorandum_id=memorandum_id, filename=file.filename, status="ready")
    db.add(script)
    db.flush()  # assign script.id before adding answers

    split_by_number = {str(a.get("question_number")): a.get("answer_text", "") for a in split}
    for number in question_numbers:
        db.add(
            ScriptAnswer(
                script_id=script.id,
                question_number=number,
                answer_text=split_by_number.get(number, ""),
            )
        )
    db.commit()
    db.refresh(script)
    return script


@router.get("/{script_id}", response_model=LearnerScriptOut)
def get_script(script_id: int, db: Session = Depends(get_db)):
    script = db.get(LearnerScript, script_id)
    if script is None:
        raise HTTPException(status_code=404, detail="Script not found")
    return script
