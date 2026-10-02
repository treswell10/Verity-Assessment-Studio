"""Calls to the local/remote Ollama server using structured (JSON-schema) output."""
import json

import httpx

from ..config import OLLAMA_BASE_URL, OLLAMA_MODEL


class OllamaError(Exception):
    """Raised when Ollama is unreachable or returns something we can't parse."""


def chat_structured(system_prompt: str, user_prompt: str, json_schema: dict) -> dict:
    """Send a chat request constrained to `json_schema` and return the parsed JSON dict.

    Raises OllamaError on network failure, non-2xx response, or invalid JSON in the
    response content. Callers decide how to treat that (e.g. escalate to teacher review).
    """
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "format": json_schema,
        "stream": False,
    }
    try:
        response = httpx.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload, timeout=120)
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
        "You are an assistant that extracts a marking memorandum into structured data. "
        "Read the memorandum text and return every question it contains. For each question, "
        "'question' must be ONLY the short question number or label exactly as written in the "
        "memorandum (for example '1.1', '1.2', '2a') — never the question text itself. "
        "'expected_answer' is the memo's expected/model answer for that question, and 'max_mark' "
        "is the number of marks it is worth. Keep expected_answer concise but complete."
    )
    result = chat_structured(system_prompt, memo_text, MEMO_EXTRACTION_SCHEMA)
    return result.get("questions", [])


def split_script_answers(script_text: str, question_numbers: list[str]) -> list[dict]:
    """Return a list of {question_number, answer_text} dicts split from a learner's script."""
    from ..schemas import ANSWER_SPLIT_SCHEMA

    system_prompt = (
        "You are an assistant that splits a learner's assessment script into per-question "
        "answers. The memorandum has these question numbers, in order: "
        f"{', '.join(question_numbers)}. Read the learner's script text and return one entry "
        "per question number, with 'question_number' matching exactly one of the numbers above "
        "and 'answer_text' containing that question's answer as written by the learner. If a "
        "question has no answer in the script, return an empty string for answer_text."
    )
    result = chat_structured(system_prompt, script_text, ANSWER_SPLIT_SCHEMA)
    return result.get("answers", [])
