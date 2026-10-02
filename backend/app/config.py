"""App-wide configuration, read from environment variables with sane local defaults."""
import os

OLLAMA_BASE_URL = os.environ.get("MARKER_OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("MARKER_OLLAMA_MODEL", "qwen2.5:7b-instruct")

# Confidence threshold (0-100) below which a marking result is escalated to the
# teacher as "Teacher Review Needed" instead of being proposed outright.
# Single adjustable constant per spec.md > Decisions and Open Issues.
CONFIDENCE_THRESHOLD = 70
