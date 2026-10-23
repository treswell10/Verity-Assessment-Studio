# Verity Assessment Studio

**AI Marking with the Teacher in Control**

Verity Assessment Studio is a human-in-the-loop AI assessment marking web application built for educators. Verity extracts questions from a marking memorandum, aligns learner scripts (individually or in bulk), and proposes a mark per question with plain-English reasoning and a confidence score. Whenever the AI is uncertain (`< 70%` confidence), it flags the question for mandatory teacher review instead of guessing. No mark is final until the teacher reviews and signs off.

---

## Key Features

1. **Memorandum Extraction & Verification**
   - Upload a marking memorandum (`.pdf` or `.txt`) via drag-and-drop.
   - Verity extracts every question number, expected answer, and maximum mark allocation.
   - Teachers review total marks and question counts and can edit any question before confirming the memorandum.

2. **Single & Bulk Learner Script Upload**
   - Upload a single learner script or select multiple scripts in bulk (`.pdf` or `.txt`).
   - Verity automatically splits each learner's script into per-question answers aligned with the confirmed memorandum and queues the batch for marking.

3. **Side-by-Side Question Review & Confidence Escalation**
   - **Side-by-Side Comparison:** View the **Memorandum (Expected Answer)** and the **Learner's Answer** right next to each other for every question.
   - **Transparent AI Suggestions:** Shows the proposed mark, a visual confidence bar, and a plain-English explanation of why that mark was suggested.
   - **Confidence Escalation (`< 70%`):** Low-confidence or ambiguous answers are highlighted in amber (`⚠️ Teacher Review Needed`) and require explicit teacher action (**Confirm AI Mark** or **Change Mark**).
   - **Question Navigator Bar:** Jump between questions at any time with live status badges (`✓` reviewed, `!` needs review).

4. **Accountable Teacher Sign-Off**
   - Sign-off is hard-blocked (`HTTP 409`) if any question remains unreviewed, listing links to jump straight to unresolved questions.
   - Once all questions are confirmed or adjusted, signing off locks the final score and timestamp.

5. **Modern Excel Class Marksheet (`.xlsx`) & Printable Learner Reports**
   - **Modern Excel Marksheet (`.xlsx`):** Powered by `openpyxl`, exports a formatted spreadsheet with a navy header banner, per-question mark columns (`Q1 (/2)`), green/amber conditional formatting on percentages, and an automatic **Class Average** summary row (plus `.csv` export).
   - **Download Marked Script (for Learner):** Downloads a clean, printable HTML/PDF report for each learner containing their final score, teacher sign-off timestamp, side-by-side expected vs. submitted answers, awarded marks, and per-question feedback.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS (`Plus Jakarta Sans` & `Inter`)
- **Backend:** Python, FastAPI, SQLAlchemy, SQLite (`verity.db`)
- **Document & Spreadsheet Processing:** `pypdf` (PDF text extraction), `openpyxl` (styled `.xlsx` marksheets)
- **Local / On-Prem AI:** Ollama (`qwen2.5:7b-instruct`) via `/api/chat` structured JSON output

---

## Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **Ollama** running locally (`http://localhost:11434`) or on an accessible host, with `qwen2.5:7b-instruct` pulled:
  ```bash
  ollama pull qwen2.5:7b-instruct
  ```

### 1. Start the Backend (FastAPI)
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*(Optional environment variables: `MARKER_OLLAMA_BASE_URL` and `MARKER_OLLAMA_MODEL`.)*

### 2. Start the Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open **`http://127.0.0.1:5173`** in your browser.

---

## Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint & CORS setup
│   │   ├── config.py            # Ollama URL/model & CONFIDENCE_THRESHOLD (70%)
│   │   ├── database.py          # SQLite + SQLAlchemy engine & session
│   │   ├── models.py            # Memorandum, MemoQuestion, LearnerScript, ScriptAnswer, MarkingResult
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── memoranda.py     # Upload, extract, edit, and confirm memoranda
│   │   │   ├── scripts.py       # Upload & split learner scripts
│   │   │   └── marking.py       # AI marking, review, sign-off, .xlsx/.csv marksheet, learner report
│   │   └── services/
│   │       ├── extraction.py    # .txt and .pdf text extraction (pypdf)
│   │       └── ollama_client.py # Structured JSON calls to Ollama
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # 5-step workflow header, state & bulk script queue
│   │   ├── api/client.ts        # Backend API client
│   │   └── screens/             # Landing, MemoUpload, MemoCheck, ScriptUpload, ScriptReady,
│   │                            # MarkingScreen, MarkingComplete, MarkFinalised, Modals
│   └── package.json
└── devpost/                     # Scope, PRD, Technical Spec, Checklist & App Map
    ├── scope.md / scope.html
    ├── prd.md   / prd.html
    ├── spec.md  / spec.html
    ├── checklist.md
    └── app-map.html
```

