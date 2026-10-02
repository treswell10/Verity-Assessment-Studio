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


class ScriptAnswerOut(BaseModel):
    id: int
    question_number: str
    answer_text: str

    model_config = {"from_attributes": True}


class LearnerScriptOut(BaseModel):
    id: int
    memorandum_id: int
    filename: str
    status: str
    final_score: float | None
    final_percentage: float | None
    answers: list[ScriptAnswerOut]

    model_config = {"from_attributes": True}


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

# Call shape 3: split a learner's script text into per-question answers,
# matching the memo's question numbers.
ANSWER_SPLIT_SCHEMA = {
    "type": "object",
    "properties": {
        "answers": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question_number": {"type": "string"},
                    "answer_text": {"type": "string"},
                },
                "required": ["question_number", "answer_text"],
            },
        }
    },
    "required": ["answers"],
}
