---
doc: prd
status: approved
---
<!-- `status` is the progress state every skill reads. Write `draft` when you first save this file,
     and change it to `approved` when the learner clearly approves the displayed plan ("looks good" counts).
     Do not request a second sign-off. Never skip the draft save —
     an unsaved draft dies with the conversation. -->

# Verity Assessment Studio — Product Requirements

Verity Assessment Studio is a proof of concept where AI proposes marks for a learner's assessment script, question by question, and the teacher reviews, corrects, and signs off before any mark is final.
Source: `scope.md > The Core Loop`, `scope.md > The Unique Kernel`.

## The Core Journey

1. **Landing** — the teacher opens Verity Assessment Studio and sees the clean, friendly "Upload Memorandum" entry point.
2. **Upload memorandum** — the teacher selects or drags-and-drops the memo file (`.pdf` or `.txt`). Verity extracts question numbers, expected answers, and marks.
3. **Check your memorandum** — the teacher reviews the extracted questions alongside total marks and question counts, edits any question that needs fixing, and continues once it's right.
4. **Upload learner scripts (single or bulk)** — the teacher uploads one learner's completed assessment or selects a batch of scripts in bulk. Verity splits each script into per-question answers and queues them for marking.
5. **Start AI marking** — the teacher explicitly triggers marking; nothing happens automatically on upload.
6. **Question-by-question marking** — Verity shows a top question navigator bar and a side-by-side comparison of the **Memorandum (Expected Answer)** and the **Learner's Answer** on the left, alongside the **Suggested Mark**, plain-English explanation ("Why Verity suggested this mark"), and confidence bar on the right. The teacher confirms or changes each mark. Low-confidence questions are flagged and block progress until resolved.
7. **Marking complete** — once every question is confirmed or changed, Verity shows the final score, percentage, and a checklist confirming all questions were reviewed.
8. **Sign off, Class Marksheet & Learner Reports** — the teacher signs off the final mark. Only after sign-off is the mark locked and added to the live **Class Marksheet**. From the finalised screen, the teacher can download a printable **Marked Script Report** to send to the learner, export a **Modern Excel Marksheet (`.xlsx`)** or `.csv`, or proceed directly to the next queued script in a bulk batch.

This is the spine of the proof of concept — every section below elaborates one of these steps.

## Screens and Layout

- **Persistent Workflow Header** — displayed on every screen after Landing, showing the 5 plain-English steps: `1. Upload Memo` → `2. Check Memo` → `3. Upload Script` → `4. Review Marks` → `5. Final Sign-Off`.
- **Landing screen** — badge "AI Marking Assistant for Teachers", title "Verity Assessment Studio," subheading "AI Marking with the Teacher in Control," plain-English reassurance ("Verity suggests the marks and explains why. You check each answer, change any mark you want, and approve the final score."), and an "Upload Memorandum →" button.
- **Check Your Memorandum** — header with Total Marks and Questions counters, plus a list of extracted questions each showing question badge (`Q1`), mark allocation, expected answer, and an "Edit" button, followed by "Looks Good, Continue →".
- **Edit Question** (modal) — three editable fields: question number, expected answer, marks. "Cancel" and "Save Changes" actions; saving returns to Check Your Memorandum with the correction applied.
- **Upload Learner Scripts** — drag-and-drop or file picker supporting single or multiple (`.pdf` / `.txt`) learner scripts in bulk, with live per-file progress ("Reading script 1 of N…").
- **Learner Script Ready** — confirms the script is ready with extracted answer count, shows the batch queue status (`✓ Done`, `Up Next`, `Queued`) when uploading in bulk, and provides a single "Start AI Marking →" action.
- **Marking screen** (main review screen) — top question pill bar (`Q1`, `Q2`, … with `✓` and `!` badges and "Reviewed X of Y questions" counter) above a two-pane layout:
  - **Left pane (Question Comparison):** displays **Memorandum (Expected Answer)** and **Learner's Answer** side-by-side so the teacher can compare them directly without leaving the screen.
  - **Right pane (Suggested Mark):** displays Proposed Mark, visual confidence meter bar, and "Why Verity suggested this mark." Actions: "Change Mark" and "Confirm." Advances automatically to the next question after confirmation.
- **Change Mark** (modal) — shows the AI-proposed mark and an editable teacher mark field (supports half-marks). "Cancel" and "Save & Continue" actions.
- **Teacher Review Needed** (escalation state on the marking screen) — same layout as a normal question, but visually highlighted in amber with a "⚠️ Teacher Review Needed" badge when confidence is below 70%. Actions: "Change Mark" and "Confirm AI Mark." Blocks advancing until resolved.
- **Marking Complete** — final score and percentage, a checklist ("All questions reviewed," "Any AI suggestions changed by the teacher are included"), an unresolved-questions warning if any remain, and "Sign Off Final Mark →".
- **Mark Finalised & Class Marksheet** — confirms the score is locked ("This mark has been reviewed and approved by the teacher. The script is now final."), provides a **"⬇ Download Marked Script (for Learner)"** button, a **"Mark Next Queued Script (N left) →"** (or **"Upload More Scripts →"**) button, and displays the live **Class Marksheet** table with a **"📗 Download Modern Excel Marksheet (.xlsx)"** button, CSV export, class average badge, and per-learner report download links.

## Look and Feel

Clean, modern, professional, but approachable — calm and trustworthy, consistent with the learner's existing Verity presentation materials. Simplicity and teacher control are the visual theme, not a complex dashboard.

- White/light background
- Dark navy or blue as the primary color
- Green for confirmed/correct
- Amber for "Teacher Review Needed"
- Red reserved only for errors
- Large cards, clear buttons, minimal text per screen
- No complex dashboards in the PoC — every screen is a single focused task

## Features and Behavior

### Memorandum intake and correction
- Teacher uploads a memo file; Verity extracts question number, expected answer, and marks per question.
- Teacher can edit any extracted question (number, expected answer, marks) before continuing — the AI-extracted standard is never used unchecked.
- Teacher explicitly confirms the memo ("Looks Good, Continue") before moving forward.

### Learner script intake (single & bulk)
- Teacher uploads one learner script or selects multiple scripts in bulk (`.pdf` or `.txt`).
- Verity extracts and splits each script's answers per question, queues the batch, and confirms the script is ready; marking does not start automatically — the teacher clicks "Start AI Marking."

### Question-by-question AI marking with side-by-side memo comparison
- For each question, Verity shows: the **Memorandum (Expected Answer)** and the **Learner's Answer** side-by-side on the left, and a **Suggested Mark** (out of the memo's allocation), a short plain-language reason ("Why Verity suggested this mark"), and a confidence percentage bar on the right.
- If confidence is high enough, the teacher can "Confirm" (accept as-is) or "Change Mark" (override the score directly, no explanation required).
- If confidence is low (<70%), the question is flagged "⚠️ Teacher Review Needed" instead of silently proposing a mark; the teacher must "Confirm AI Mark" or "Change Mark" before Verity advances.
- After confirmation or a saved change, Verity automatically advances to the next unresolved question.

### Completion, sign-off, Excel marksheet & learner report export
- After the last question, Verity shows the final score, percentage, and a checklist confirming every question was reviewed and any teacher changes are included.
- Sign-off is blocked if any question is still unresolved — the teacher is shown which question(s) remain and can jump directly to them.
- Clicking "Sign Off Final Mark" locks the result; the finalized screen:
  - States the mark has been reviewed and approved by the teacher and is now final.
  - Lets the teacher **Download Marked Script (for Learner)** — a clean, printable HTML/PDF report showing each question's learner answer, expected memo answer, awarded mark, and feedback.
  - Displays the live **Class Marksheet** table across all finalized scripts for the memorandum, with a one-click **Download Modern Excel Marksheet (`.xlsx`)** (formatted with navy headers, per-question columns, pass/review color coding, and a Class Average row) as well as `.csv` export.
  - Lets the teacher immediately continue to the next queued script when marking a bulk batch.

- As a Mathematics teacher reviewing one learner's script, I want to see Verity's proposed mark and reasoning per question so that I can quickly confirm correct answers and focus my attention on the ones that need judgment.
  - [ ] Each question shows proposed mark, reasoning, and confidence before the teacher acts.
  - [ ] Confirming a question advances to the next one without extra steps.
- As that same teacher, I want Verity to stop and ask me when it's unsure rather than guess, so that no learner is marked by an unchecked AI decision.
  - [ ] A question below the confidence threshold is visibly flagged "Teacher Review Needed" instead of silently showing a proposed mark alongside the others.
  - [ ] Marking cannot advance past a flagged question until the teacher confirms or changes it.
- As that same teacher, I want my sign-off to be the only thing that finalizes a mark, so that I remain accountable for the result.
  - [ ] Sign-off is unavailable while any question is unresolved.
  - [ ] After sign-off, the screen clearly states the mark is final and reviewed by the educator.

## States and Boundaries

- **First use (landing)** — no memo uploaded yet; the only available action is "Upload Memorandum."
- **Memo check state** — extracted questions shown for confirmation; nothing is marked yet, and the memo can be freely edited.
- **Script ready state** — memo confirmed, script uploaded, marking not yet started; the only action is "Start AI Marking."
- **Normal marking state** — AI proposes a mark with high enough confidence; teacher can confirm or change it.
- **Escalated/uncertain state** — AI confidence is low; marked "⚠️ Teacher Review Needed"; blocks progress until resolved.
- **Unresolved review blocks sign-off** — attempting to sign off with an unresolved flagged question shows "⚠️ [N] question(s) still need your review" with a "Review Question" action; sign-off is unavailable until resolved.
- **Invalid/unreadable upload** — memo or script file can't be read: "We couldn't read this file. Please upload a clear PDF or image and try again." with "Try Again."
- **Blank/empty file** — file has no extractable content: "No content was found in this file." with "Upload Another File."
- **Finalized state** — once signed off, the mark is locked and displayed as final; this is the end state of the PoC's single-script journey.

## Product Decisions

- Memo correction happens before any script is uploaded, and script upload happens before marking starts — each step requires an explicit teacher action, nothing auto-advances into AI marking without consent.
- "Change Mark" and "Confirm AI Mark" use identical controls for both normal overrides and escalated questions, so the teacher learns one interaction — simplicity was chosen over adding a required explanation field for overrides.
- Sign-off is hard-blocked while any question remains flagged — this directly enforces the kernel ("AI proposes, teacher decides") rather than leaving it to the teacher's discretion.
- Error messaging avoids technical detail ("We couldn't read this file" rather than a format/parsing error) to keep the tone calm and non-technical for the PoC's target user.
- Visual language reserves red strictly for errors, amber strictly for "needs review," and green for confirmed — color consistently signals trust state, not just decoration.

## What We're Building

- Full click-through for one memo and single or bulk learner scripts: landing → memo upload/extraction/edit → single/bulk script upload → question-by-question AI marking with side-by-side memo vs. learner answer comparison and confidence-based escalation → marking complete → sign-off → finalized screen with live Class Marksheet, Modern Excel (`.xlsx`) / `.csv` export, and downloadable Marked Script Report for the learner.
- Plain, approachable English tailored for educators, with a 5-step progress header (`1. Upload Memo` → `2. Check Memo` → `3. Upload Script` → `4. Review Marks` → `5. Final Sign-Off`).
- Visible AI reasoning and confidence bar per question, alongside side-by-side expected vs. learner answers.
- Teacher override (Change Mark) available at every question, with identical controls for normal and escalated questions.
- Hard block on sign-off while any question is unresolved.
- Graceful handling of unreadable/blank uploads for both memo and script.

## Deferred From the POC

- Live hardware ADF scanner integration and QR separator sheets.
- Handwriting OCR — the PoC uses clear, readable (typed or pre-scanned legible) `.txt` and `.pdf` answers.
- Multi-assessment longitudinal analytics and department-wide dashboards.
- Any authentication, multi-teacher, or role-based access — this PoC is single-teacher, local-first.

## Possible Later Enhancements

- Teacher-written explanations attached to overrides, for later audit trails.
- Confidence threshold tuning exposed to the teacher or administrator.
- A running class view once multiple scripts can be processed.

## Non-Goals

- Verity will not finalize or publish any mark without explicit teacher sign-off — this is the product's non-negotiable principle, not a cut feature.
- Verity will not attempt handwriting OCR in this PoC — out of scope per `scope.md > Later`.
- Verity will not process more than one learner script in this PoC — bulk ingestion is explicitly deferred.
- Verity will not require a written explanation for a teacher's override — kept simple for the hackathon demo.

## Open Questions

- Exact confidence threshold that triggers "Teacher Review Needed" (e.g., the 92%/58% examples used in conversation) — can be decided during `4-spec`/`5-build`; doesn't block PRD approval.
- Supported file formats for memo/script upload (PDF only, images, both) — can be resolved in `4-spec`.
