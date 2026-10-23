"""Calls to the local/remote Ollama server using structured (JSON-schema) output."""
import json

import httpx

from ..config import OLLAMA_BASE_URL, OLLAMA_MODEL


class OllamaError(Exception):
    """Raised when Ollama is unreachable or returns something we can't parse."""


def chat_structured(system_prompt: str, user_prompt: str, json_schema: dict) -> dict:
    """Send a chat request constrained to JSON and return the parsed JSON dict.

    Raises OllamaError on network failure, non-2xx response, or invalid JSON in the
    response content. Callers decide how to treat that (e.g. escalate to teacher review).
    """
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "format": "json",
        "options": {
            "temperature": 0.1,
            "num_predict": 1024,
        },
        "stream": False,
    }
    try:
        timeout = httpx.Timeout(300.0, connect=10.0)
        with httpx.Client(trust_env=False, timeout=timeout) as client:
            response = client.post(f"{OLLAMA_BASE_URL.rstrip('/')}/api/chat", json=payload)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise OllamaError(f"Ollama request failed: {exc}") from exc

    data = response.json()
    content = data.get("message", {}).get("content", "")
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise OllamaError(f"Ollama returned invalid JSON: {exc}") from exc


def extract_memo_questions(memo_text: str) -> list[dict]:
    """Return a list of {question, expected_answer, max_mark} dicts extracted from memo_text."""
    from ..schemas import MEMO_EXTRACTION_SCHEMA

    system_prompt = (
        "You are an assistant that extracts a marking memorandum into structured JSON data. "
        "Read the memorandum text and return a JSON object with a single key \"questions\" containing an array of objects. "
        "Each object in \"questions\" MUST have exactly these keys: "
        "\"question\" (string: ONLY the short question number or label exactly as written, e.g. \"1\", \"1.1\", \"2a\" — never the question text itself), "
        "\"expected_answer\" (string: the memo's expected/model answer, concise but complete), and "
        "\"max_mark\" (number: the number of marks it is worth). "
        'Example output: {"questions": [{"question": "1", "expected_answer": "Central Processing Unit.", "max_mark": 2}]}'
    )
    result = chat_structured(system_prompt, memo_text, MEMO_EXTRACTION_SCHEMA)
    return result.get("questions", [])


def split_script_answers(script_text: str, question_numbers: list[str]) -> list[dict]:
    """Return a list of {question_number, answer_text} dicts split from a learner's script."""
    from ..schemas import ANSWER_SPLIT_SCHEMA

    system_prompt = (
        "You are an assistant that splits a learner's assessment script into per-question answers in JSON format. "
        "The memorandum has these question numbers, in order: "
        f"{', '.join(question_numbers)}. Read the learner's script text and return a JSON object with a single key \"answers\" "
        "containing one object per question number, with \"question_number\" (string matching one of the numbers above) "
        "and \"answer_text\" (string containing that question's answer as written by the learner, or \"\" if unanswered). "
        'Example output: {"answers": [{"question_number": "1", "answer_text": "Central Processing Unit"}]}'
    )
    result = chat_structured(system_prompt, script_text, ANSWER_SPLIT_SCHEMA)
    return result.get("answers", [])


def mark_answer(
    question_number: str, expected_answer: str, max_mark: float, learner_answer: str
) -> dict:
    """Return {proposed_mark, reason, confidence} for one question's learner answer."""
    from ..schemas import PER_QUESTION_MARKING_SCHEMA

    system_prompt = (
        "You are an assistant marking one question of a learner's assessment. You are given "
        "the memorandum's expected answer, the marks available, and the learner's actual "
        "answer. Return a JSON object with keys: \"proposed_mark\" (number out of available marks), "
        "\"reason\" (string: one or two plain-language sentences), and \"confidence\" (number 0-100). "
        "Recognize valid alternative methods and carried-forward errors as full or "
        "partial credit where appropriate. Lower your confidence when the answer is ambiguous, "
        "uses an unconventional method, or is a borderline case. "
        'Example output: {"proposed_mark": 2, "reason": "Matches expected answer.", "confidence": 95}'
    )
    user_prompt = (
        f"Question {question_number} (out of {max_mark} marks)\n"
        f"Expected answer: {expected_answer}\n"
        f"Learner's answer: {learner_answer or '(no answer given)'}"
    )
    result = chat_structured(system_prompt, user_prompt, PER_QUESTION_MARKING_SCHEMA)
    return result
