"""Pydantic request/response models and the JSON-schema shapes sent to Ollama."""
from pydantic import BaseModel


# ---- API response/request shapes ----

class MemoQuestionOut(BaseModel):
    id: int
    question_number: str
    expected_answer: str
    max_mark: float
    order: int

    model_config = {"from_attributes": True}


class MemorandumOut(BaseModel):
    id: int
    filename: str
    status: str
    questions: list[MemoQuestionOut]

    model_config = {"from_attributes": True}


class MemoQuestionUpdate(BaseModel):
    question_number: str | None = None
    expected_answer: str | None = None
    max_mark: float | None = None


# ---- Ollama structured-output JSON schemas ----

# Call shape 1: memo extraction -> list of {question, expected_answer, max_mark}
MEMO_EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "expected_answer": {"type": "string"},
                    "max_mark": {"type": "number"},
                },
                "required": ["question", "expected_answer", "max_mark"],
            },
        }
    },
    "required": ["questions"],
}
