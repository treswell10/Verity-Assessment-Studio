"""Text extraction from uploaded memo/script files (.txt and text-based .pdf)."""
from pypdf import PdfReader
import io


class UnreadableFileError(Exception):
    """Raised when a file can't be parsed at all (wrong/corrupt format)."""


class BlankFileError(Exception):
    """Raised when a file parses fine but contains no extractable text."""


def extract_text(filename: str, content: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:  # pypdf raises various errors on malformed PDFs
            raise UnreadableFileError(str(exc)) from exc
    elif lower.endswith(".txt"):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise UnreadableFileError(str(exc)) from exc
    else:
        raise UnreadableFileError(f"Unsupported file type: {filename}")

    if not text.strip():
        raise BlankFileError("No extractable text found")

    return text
