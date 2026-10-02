---
doc: spec
status: approved
---
<!-- `status` is the progress state every skill reads. Write `draft` when you first save this file,
     and change it to `approved` when the learner clearly approves the displayed plan ("looks good" counts).
     Do not request a second sign-off. Never skip the draft save —
     an unsaved draft dies with the conversation. -->

# Verity Assessment Studio — Technical Spec

## How This Works, In Plain Language

Verity is a local web app with two halves that talk to each other. A **frontend** (what you see in the browser — React) shows the screens from your PRD: upload, check memo, upload script, mark questions, sign off. A **backend** (FastAPI, a Python web server) does the real work: it reads the uploaded files, stores everything in a small local database file (SQLite — think of it as a spreadsheet the program reads and writes), and talks to **Ollama**, a program running on your own machine that hosts the AI model (`qwen2.5:7b-instruct`). Nothing leaves your laptop — the memo, the script, and the marking all happen locally, which matches the "scripts stay under the school's control" principle from your scope.

When the backend needs the AI to do something — extract memo questions, or mark an answer — it sends a request to Ollama and asks for a **structured response**: not free-form text, but JSON shaped exactly like `{question, proposed_mark, max_mark, reason, confidence}`. Ollama enforces that shape during generation, so the response is reliable. If it ever still comes back malformed, the backend doesn't crash — it treats that question as needing teacher review, same as low confidence.

## The Core Journey Through the System

Implements `prd.md > The Core Journey`.

1. **Landing** — the React app loads; nothing is stored yet.
2. **Upload Memorandum** → frontend sends the file to the backend (`POST /api/memoranda`). The backend extracts raw text (direct read for `.txt`, `pypdf` extraction for `.pdf`), then asks Ollama to return the memo as structured JSON (a list of `{question, expected_answer, max_mark}`). The backend saves a `Memorandum` and its `MemoQuestion` rows in SQLite, and returns them to the frontend.
3. **Check Your Memorandum** — frontend renders the returned questions. **Edit Question** sends `PATCH /api/memoranda/{id}/questions/{qid}` to update one row. **Looks Good, Continue** sends `PATCH /api/memoranda/{id}` to mark the memo confirmed.
4. **Upload Learner Script** → frontend sends the file (`POST /api/scripts`, linked to the confirmed memorandum). The backend extracts its text the same way, then asks Ollama to split it into per-question answers matching the memo's question numbers, and stores `ScriptAnswer` rows. The frontend shows **Learner Script Ready**.
5. **Start AI Marking** → frontend calls `POST /api/scripts/{id}/mark`. The backend loops through every memo question once, calling Ollama for each with the memo's expected answer + the learner's answer, and stores one `MarkingResult` row per question (`proposed_mark`, `reason`, `confidence`, `status: "proposed"`). This all happens in one backend call — the frontend doesn't talk to Ollama directly, and there's no live streaming.
6. **Marking screen** — frontend fetches the full list of `MarkingResult`s and steps through them one at a time, exactly as your PRD describes. **Confirm** or **Change Mark** / **Confirm AI Mark** send `PATCH /api/scripts/{id}/results/{question}` with the final mark, setting `status` to `"confirmed"` or `"changed"`.
7. **Marking Complete** — frontend calls `GET /api/scripts/{id}/summary`, which totals the confirmed/changed marks and reports whether any question is still `"proposed"` (unresolved).
8. **Sign Off** → `POST /api/scripts/{id}/sign-off`. The backend rejects this (409) if any `MarkingResult` is still `"proposed"` — same rule as the PRD's blocked sign-off state. Otherwise it sets the script to `"finalized"` with the final score and timestamp, and the frontend shows **Mark Finalised**.

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS. [Vite docs](https://vitejs.dev/guide/) · [Tailwind + Vite guide](https://tailwindcss.com/docs/guides/vite) · [React docs](https://react.dev/)
- **Backend:** FastAPI + SQLAlchemy + SQLite. [FastAPI docs](https://fastapi.tiangolo.com/) · [SQLAlchemy docs](https://docs.sqlalchemy.org/)
- **PDF text extraction:** `pypdf` (pure-Python, no system dependencies — good fit for a local PoC). [pypdf docs](https://pypdf.readthedocs.io/)
- **AI:** Ollama running locally, model `qwen2.5:7b-instruct`, called via its `/api/chat` endpoint with a JSON Schema `format` for structured output. [Ollama API docs](https://github.com/ollama/ollama/blob/main/docs/api.md) · [Ollama structured outputs](https://ollama.com/blog/structured-outputs)

Rationale: this is the learner's established stack, chosen for familiarity and because it keeps the "runs locally, no cloud dependency" principle real rather than aspirational. Tradeoff accepted: `qwen2.5:7b-instruct` is text-only, so input is limited to `.txt` and text-based `.pdf` (see **What Was Simplified and Why**).

**Unverified, flag to check early in the build:** exact `qwen2.5:7b-instruct` JSON-schema adherence quality in practice — the fallback-to-review behavior below covers this regardless, but confirm the happy path works cleanly on your machine before building the rest around it.

## Where It Runs and How Someone Tries It

Local only, for this PoC — run on your own machine and record the demo video. No deployment.

**Prerequisites:** Python 3.11+, Node 18+, [Ollama installed](https://ollama.com/download), model pulled with `ollama pull qwen2.5:7b-instruct`.

**Start it:**
1. `ollama serve` (or confirm it's already running) — must be reachable at `http://localhost:11434`.
2. Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload` — serves the API at `http://localhost:8000`.
3. Frontend: `cd frontend && npm install && npm run dev` — opens the app at `http://localhost:5173`.

**What to show in the recording:** the full journey — upload memo, check/edit it, upload script, start marking, confirm a normal question, resolve an escalated one, reach Marking Complete, and sign off to Mark Finalised.

## Look and Feel

Implements `prd.md > Look and Feel`.

Tailwind config defines the palette directly: navy (`#1f3350`) as primary/brand color, green (`#2f7a4f`) for confirmed/correct, amber (`#b5790b`) for "Teacher Review Needed," red (`#b23b3b`) reserved only for error states. White/light background (`#fbfaf7` or Tailwind's default `gray-50`). Cards use generous padding, rounded corners, and soft shadows — spacious and calm, not dense. Buttons are large and clearly labeled ("Confirm," "Change Mark," "Sign Off Final Mark") rather than icon-only. Interface copy stays short and plain, matching the PRD's screen text exactly where given.

## Components

### Memo intake and correction
Implements `prd.md > Memorandum intake and correction`.
- Backend: `routers/memoranda.py` (upload, extract, edit, confirm), `services/extraction.py` (text extraction), `services/ollama_client.py` (structured extraction call).
- Frontend: `screens/MemoUpload.tsx`, `screens/MemoCheck.tsx`, `screens/EditQuestionModal.tsx`.

### Learner script intake
Implements `prd.md > Learner script intake`.
- Backend: `routers/scripts.py` (upload, extract, split into per-question answers).
- Frontend: `screens/ScriptUpload.tsx`, `screens/ScriptReady.tsx`.

### Question-by-question AI marking
Implements `prd.md > Question-by-question AI marking`.
- Backend: `routers/marking.py` (start marking, per-question Ollama calls, confirm/change endpoint).
- Frontend: `screens/MarkingScreen.tsx`, `screens/ChangeMarkModal.tsx`.

### Completion and sign-off
Implements `prd.md > Completion and sign-off`.
- Backend: `routers/marking.py` (summary, sign-off with the unresolved-question block).
- Frontend: `screens/MarkingComplete.tsx`, `screens/MarkFinalised.tsx`.

## Data Model

SQLite via SQLAlchemy. One memorandum can mark many scripts; each script belongs to one memorandum.

- **Memorandum** — `id`, `filename`, `status` (`"draft" | "confirmed"`), `created_at`.
- **MemoQuestion** — `id`, `memorandum_id` (FK), `question_number`, `expected_answer`, `max_mark`, `order`. Edited directly by the teacher before confirmation; persists as-is afterward.
- **LearnerScript** — `id`, `memorandum_id` (FK), `filename`, `status` (`"ready" | "marking" | "finalized"`), `final_score`, `final_percentage`, `signed_off_at`, `created_at`.
- **ScriptAnswer** — `id`, `script_id` (FK), `question_number`, `answer_text` — the learner's extracted answer per question.
- **MarkingResult** — `id`, `script_id` (FK), `question_number`, `proposed_mark`, `max_mark`, `reason`, `confidence`, `final_mark` (nullable until resolved), `status` (`"proposed" | "confirmed" | "changed"`).

Where data lives and persists: everything is written to a single local SQLite file (`backend/verity.db`) as each step completes, so closing and reopening the app mid-flow would show whatever was last saved — there's no separate "session" concept needed for a single-teacher, single-script PoC.

## File Structure

```
verity/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration
│   │   ├── database.py          # SQLAlchemy engine/session, SQLite setup
│   │   ├── models.py            # Memorandum, MemoQuestion, LearnerScript, ScriptAnswer, MarkingResult
│   │   ├── schemas.py           # Pydantic request/response models + Ollama JSON-schema shapes
│   │   ├── config.py            # env vars: MARKER_OLLAMA_BASE_URL, MARKER_OLLAMA_MODEL
│   │   ├── routers/
│   │   │   ├── memoranda.py     # upload / extract / edit / confirm memo
│   │   │   ├── scripts.py       # upload / extract learner script
│   │   │   └── marking.py       # start marking, confirm/change, summary, sign-off
│   │   └── services/
│   │       ├── extraction.py    # .txt/.pdf text extraction (pypdf)
│   │       └── ollama_client.py # calls to Ollama /api/chat with JSON-schema format
│   ├── verity.db                # SQLite file (gitignored)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx              # steps through screens in sequence
│   │   ├── screens/
│   │   │   ├── Landing.tsx
│   │   │   ├── MemoUpload.tsx
│   │   │   ├── MemoCheck.tsx
│   │   │   ├── EditQuestionModal.tsx
│   │   │   ├── ScriptUpload.tsx
│   │   │   ├── ScriptReady.tsx
│   │   │   ├── MarkingScreen.tsx
│   │   │   ├── ChangeMarkModal.tsx
│   │   │   ├── MarkingComplete.tsx
│   │   │   └── MarkFinalised.tsx
│   │   ├── components/          # shared Button, Card, ConfidenceBadge, etc.
│   │   ├── api/client.ts         # fetch wrappers to the FastAPI backend
│   │   └── styles/               # Tailwind entry + config
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── devpost/                      # Devpost learning workspace
└── README.md
```

## External Services and Dependencies

**Ollama (local).**
- Endpoint: `POST http://localhost:11434/api/chat`
- Payload: `{ "model": "qwen2.5:7b-instruct", "messages": [...], "format": <JSON Schema>, "stream": false }`
- Response: JSON matching the supplied schema, inside the chat message content.
- Auth: none (local-only server). Rate limits: none (local). Cost: free, runs on your hardware.
- Docs: [Ollama API reference](https://github.com/ollama/ollama/blob/main/docs/api.md), [Ollama structured outputs](https://ollama.com/blog/structured-outputs).
- Two call shapes needed: (1) memo extraction — given memo text, return a list of `{question, expected_answer, max_mark}`; (2) per-question marking — given one memo question + the learner's answer for it, return `{question, proposed_mark, max_mark, reason, confidence}`. A third shape splits the learner script into per-question answers before marking.

**pypdf (library, not a service).** Extracts text from `.pdf` uploads. No network calls, no cost. [Docs](https://pypdf.readthedocs.io/).

## Important Failure Modes

- **No readable text in the uploaded file** (blank `.txt`, scanned-image `.pdf` with no text layer) → backend returns an error; frontend shows "We couldn't read this file. Please try another file." (Implements `prd.md > States and Boundaries > Invalid/unreadable upload` and `Blank/empty file`.)
- **Ollama returns malformed/invalid JSON, or is unreachable** → that question's `MarkingResult` is created with `status: "proposed"`, `confidence: 0`, and `reason: "AI response could not be parsed — please review manually."` — it's automatically treated as needing teacher review rather than crashing the marking screen.
- **Sign-off attempted with unresolved questions** → backend returns `409` listing the unresolved question numbers; frontend shows "⚠️ N question(s) still need your review" with a Review Question action, matching `prd.md > States and Boundaries > Unresolved review blocks sign-off`.

## What Was Simplified and Why

- **`.txt` and text-based `.pdf` only, no OCR or scanned images** instead of full handwriting/scanned-script support — matches `scope.md > Later` (handwriting OCR deferred) and keeps the model choice (text-only) coherent. The fuller version would need an OCR pipeline or a vision-capable model.
- **Model self-reported confidence** instead of a calibrated statistical confidence score — simpler to implement and sufficient to drive the escalation rule; it's explicitly a heuristic, not a verified probability.
- **All marking computed in one backend call, then stepped through on the frontend** instead of live/streaming AI output per question — avoids websockets or background job infrastructure. The result is identical from the teacher's point of view (one question at a time, in order); only the internal timing differs.
- **No authentication, single local SQLite file** instead of multi-teacher accounts or a hosted database — this PoC is one teacher, one sitting, matching `prd.md > Deferred From the POC`.
- **No deployment** — run locally and recorded, per the learner's choice; nothing in the architecture depends on a public URL.

## Decisions and Open Issues

- **Structured output approach (resolved the learner's stated uncertainty):** use Ollama's `format` parameter with a JSON Schema to constrain model output, validated again on the backend with Pydantic; any parse failure automatically escalates that question to teacher review rather than erroring. This was explained and agreed during the interview.
- **Confidence threshold:** 70% as the initial cutoff for "Teacher Review Needed," per the learner's decision. Treated as a single adjustable constant, not fixed in multiple places — easy to tune during `5-build` if the demo shows it's too strict or too lax.
- **File formats:** `.txt` and text-based `.pdf` accepted for both memo and learner script, no OCR — resolves the open question carried over from `prd.md > Open Questions`.
- **Carried from `prd.md > Open Questions`, now resolved:** confidence threshold and supported file formats (both above).
- **Still open, non-blocking:** exact Ollama prompt wording for each of the three call shapes (memo extraction, answer splitting, per-question marking) will be iterated on during the build rather than fixed here — expect a few rounds of prompt tuning once real model output is visible.
