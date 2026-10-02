---
doc: checklist
status: approved
---
<!-- `status` is the progress state every skill reads. Write `draft` when you first save this file,
     and change it to `approved` when the learner clearly approves the displayed plan ("looks good" counts).
     Do not request a second sign-off. Never skip the draft save —
     an unsaved draft dies with the conversation. -->

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Upload a memorandum and see what Verity extracted**
  Becomes usable: A running app (backend + frontend scaffolded) where the teacher uploads a memo file and sees the AI-extracted question list (question number, expected answer, marks) on screen. Nothing is editable or confirmed yet.
  Why now: Bootstraps the whole stack in one slice, and immediately proves the spec's flagged risk — whether `qwen2.5:7b-instruct` reliably returns structured JSON for memo extraction — before anything else is built on top of it.
  PRD ref: `prd.md > The Core Journey` (steps 1-2), `prd.md > Screens and Layout` (Landing screen, partial Check Your Memorandum)
  Spec ref: `spec.md > Components > Memo intake and correction`, `spec.md > Data Model` (Memorandum, MemoQuestion), `spec.md > External Services and Dependencies` (memo extraction call shape), `spec.md > File Structure`
  Build: Scaffold `backend/` (FastAPI app, database/session setup, models, config) and `frontend/` (Vite + React + TS + Tailwind). Implement `POST /api/memoranda` using `extraction.py` (.txt/.pdf text extraction) and `ollama_client.py` (structured memo-extraction call), saving `Memorandum` + `MemoQuestion` rows. Build `Landing.tsx` and `MemoUpload.tsx`, and render the returned questions read-only.
  Verify (mechanical): Start Ollama, backend, and frontend per `spec.md > Where It Runs and How Someone Tries It`. Upload a sample `.txt` memo and confirm the extracted questions render on screen and the rows exist in `backend/verity.db`.
  Learner check: Open the app, upload a memo file you prepare, and confirm the extracted questions look roughly right.
  Commit: `Scaffold app and add memo upload with AI extraction`

- [x] **2. Check, correct, and confirm the memorandum**
  Becomes usable: The teacher can edit any extracted question and explicitly confirm the memo ("Looks Good, Continue") before anything else happens.
  Why now: The kernel's trust model starts here — the AI-extracted standard is never used unchecked. This has to work before a script is ever marked against it.
  PRD ref: `prd.md > Memorandum intake and correction`, `prd.md > Screens and Layout` (Check Your Memorandum, Edit Question)
  Spec ref: `spec.md > Components > Memo intake and correction` (edit/confirm endpoints)
  Build: Add `PATCH /api/memoranda/{id}/questions/{qid}` and `PATCH /api/memoranda/{id}` (confirm). Build `MemoCheck.tsx` (Edit / Looks Good, Continue) and `EditQuestionModal.tsx`.
  Verify (mechanical): Edit a question's expected answer/marks via the UI, confirm the change persists in the database; confirm the memo and check its status becomes `"confirmed"`.
  Learner check: Edit a question that looks wrong, save it, confirm the correction shows, then click "Looks Good, Continue."
  Commit: `Add memo question editing and confirmation`

- [x] **3. Upload a learner script**
  Becomes usable: After confirming the memo, the teacher uploads one learner script and sees "Learner Script Ready," with its answers split per question behind the scenes.
  Why now: The next real risk — splitting a learner's free-form answer text into per-question answers — needs to be proven before marking can use it.
  PRD ref: `prd.md > Learner script intake`, `prd.md > Screens and Layout` (Upload Learner Script, Learner Script Ready)
  Spec ref: `spec.md > Components > Learner script intake`, `spec.md > Data Model` (LearnerScript, ScriptAnswer), `spec.md > External Services and Dependencies` (answer-splitting call shape)
  Build: `POST /api/scripts` (linked to the confirmed memorandum), extracting text and asking Ollama to split it into per-question `ScriptAnswer` rows matching the memo's question numbers. Build `ScriptUpload.tsx` and `ScriptReady.tsx`.
  Verify (mechanical): Upload a sample learner script and confirm `ScriptAnswer` rows exist with question numbers matching the memo, and the script's status is `"ready"`.
  Learner check: Upload a learner script and confirm you land on "Learner Script Ready."
  Commit: `Add learner script upload and answer splitting`

- [x] **4. Question-by-question AI marking with escalation**
  Becomes usable: The teacher triggers "Start AI Marking" and steps through each question with a proposed mark, reasoning, and confidence — confirming, overriding, and hitting the escalation block on low-confidence questions.
  Why now: This is the unique kernel — AI proposes, flags uncertainty, teacher decides. It belongs as early as the memo and script data make it possible, not saved for last.
  PRD ref: `prd.md > Question-by-question AI marking` (full section), `prd.md > Screens and Layout` (Marking screen, Change Mark, Teacher Review Needed)
  Spec ref: `spec.md > Components > Question-by-question AI marking`, `spec.md > Data Model` (MarkingResult), `spec.md > Decisions and Open Issues` (70% confidence threshold), `spec.md > External Services and Dependencies` (per-question marking call shape)
  Build: `POST /api/scripts/{id}/mark` looping Ollama once per memo question and storing one `MarkingResult` row each; `PATCH /api/scripts/{id}/results/{question}` for confirm/change. Build `MarkingScreen.tsx` and `ChangeMarkModal.tsx`, with the confidence threshold as a single adjustable constant and amber escalation styling that blocks advancing until resolved.
  Verify (mechanical): Run marking on the sample script and confirm a `MarkingResult` row exists for every memo question. Step through the UI: confirm a normal question advances automatically; confirm a low-confidence (or temporarily-forced) question blocks advancing until "Confirm AI Mark" or "Change Mark" is used.
  Learner check: Start AI marking on your script, confirm one normal question, then resolve a flagged "Teacher Review Needed" question.
  Commit: `Add AI marking loop with confidence-based escalation`

- [x] **5. Completion, sign-off, and the finalized mark**
  Becomes usable: The full journey runs end to end — Marking Complete, a hard sign-off block while anything is unresolved, and the Mark Finalised screen.
  Why now: Closes the loop the kernel promises — no mark is final without explicit teacher sign-off — and is the last piece needed for a complete demo run.
  PRD ref: `prd.md > Completion and sign-off`, `prd.md > Screens and Layout` (Marking Complete, Mark Finalised), `prd.md > States and Boundaries` (Unresolved review blocks sign-off, Finalized state)
  Spec ref: `spec.md > Components > Completion and sign-off`, `spec.md > Important Failure Modes` (sign-off 409 block)
  Build: `GET /api/scripts/{id}/summary` and `POST /api/scripts/{id}/sign-off` (409 with unresolved question numbers if any `MarkingResult` is still `"proposed"`). Build `MarkingComplete.tsx` and `MarkFinalised.tsx`, plus the unresolved-block banner with its "Review Question" action.
  Verify (mechanical): Run the full journey to a finalized script. Attempt sign-off with a question still unresolved and confirm the 409 and banner; resolve it, sign off, and confirm the script's status is `"finalized"` with a final score and timestamp.
  Learner check: Run the whole journey on your sample memo/script, including hitting the sign-off block once, then successfully signing off.
  Commit: `Add marking summary, sign-off gate, and finalized screen`

- [ ] **6. Graceful handling of unreadable or blank uploads**
  Becomes usable: Uploading a blank or unreadable file at either upload point shows a plain-language message instead of a crash, and the app stays usable afterward.
  Why now: The last state the PRD specifies that nothing earlier exercises; cheap to add now that both upload paths exist, and worth proving before the demo relies on clean files only.
  PRD ref: `prd.md > States and Boundaries` (Invalid/unreadable upload, Blank/empty file)
  Spec ref: `spec.md > Important Failure Modes` (first bullet)
  Build: Make `extraction.py` detect no extractable text; have the memo and script upload endpoints return a clear error; show "We couldn't read this file..." or "No content was found in this file." with a retry action on `MemoUpload.tsx` and `ScriptUpload.tsx`.
  Verify (mechanical): Upload a blank `.txt` and an unreadable file at both the memo and script upload points; confirm the correct message appears each time with no 500/crash, and the app remains usable.
  Learner check: Try uploading an empty file for the memo and for the script, and confirm you get a plain message instead of a crash.
  Commit: `Handle unreadable and blank upload errors gracefully`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after Slice 1 (memo upload + AI extraction, the flagged risk). Learner confirmed extraction worked; noted no "continue" yet, which is correctly slice 2's scope.
- [ ] Final kick-the-tires exploration and feedback completed — after Slice 6

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [what actually happened; real document/test/code references; unfinished work if interrupted]
Route and stops: [actual paths and symbols; guided stops completed, or reference-only route]
Edit outcome: [tried/kept/reverted/declined/not applicable; verification if changed]
Reflection: [offered/answered/declined/already covered — personal answer belongs only in the ignored profile]
Activity mode: [live app and editor, explicit static fallback, focused alternative, prior practice, or recap]

## Revisions
