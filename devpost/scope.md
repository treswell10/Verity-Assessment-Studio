---
doc: scope
status: approved
---
<!-- `status` is the progress state every skill reads. Write `draft` when you first save this file,
     and change it to `approved` when the learner clearly approves the displayed plan ("looks good" counts).
     Do not request a second sign-off. Never skip the draft save —
     an unsaved draft dies with the conversation. -->

# Verity — AI-Assisted Marking with the Educator in the Loop

Verity gives a first-pass, question-by-question mark proposal with reasoning, flags what it's unsure of, and lets the teacher make every final call.

## The Unique Kernel
AI proposes a mark and explains its reasoning for every question. When it's uncertain — ambiguous handwriting, an unconventional but valid method, a borderline case — it escalates to the teacher instead of guessing. The teacher reviews, confirms or overrides, and signs off. No mark reaches a learner on the software's authority alone. AI proposes, teacher decides.

## Who It's For
An ordinary South African public school teacher — picture a Mathematics teacher in Gauteng, Limpopo, Mpumalanga, the Eastern Cape, or KwaZulu-Natal — using a normal school laptop, with a stack of learner scripts to mark after a long day of teaching. Today they mark every script from scratch, by hand, question by question.

## The Core Loop
1. Upload the memorandum — question numbers, expected answers, mark allocations.
2. Upload one learner script.
3. Verity proposes a mark and a short reason for each question in turn.
4. When Verity is unsure, it flags the question for the teacher instead of guessing.
5. The teacher reviews each proposal — confirms, overrides, or awards a half-mark — then signs off.
6. Only after sign-off is the mark final.

## Inspiration & Identity
Calm, trustworthy, document-centric — closer to a careful colleague reading over your shoulder than a flashy AI tool. The proposed mark and reasoning sit directly alongside the learner's actual answer, never replacing it.

## Why This Matters to the Learner
These are children's school scripts, not anonymous documents. The non-negotiable principle driving this project: professional judgment stays decisive wherever context matters, and the educator remains accountable for every final mark. The learner wants to prove AI can give teachers time back without taking the decision away from them.

## What "Working" Looks Like
Demo in under a minute: upload a memo, upload a learner script, watch Verity mark Question 1.1 (tick, mark, reason), Question 1.2 (another proposed mark), then an answer where it recognizes a valid alternative method or a carried-forward error and proposes partial credit with reasoning — then hits an ambiguous answer and flags it for the teacher instead of guessing. The teacher reviews the flagged item, confirms or changes it, signs off, and the final mark locks in. The "oh, that's cool" beat is the moment Verity flags uncertainty instead of guessing.

## The POC Boundary
- Memo upload with question numbers, expected answers, and mark allocations
- One learner script, pre-scanned or typed — clear, readable answers (no handwriting OCR)
- Question-by-question marking: proposed mark + short reasoning per question
- Confidence-based escalation: ambiguous/uncertain answers flagged for the teacher, not auto-marked
- Teacher review interaction: confirm, override, or award partial/half marks
- Sign-off step that finalizes the mark

## Later
- Live ADF scanner integration, QR separator sheets, bulk batch processing of a full class
- Handwriting OCR
- Mark totals/percentages, mark-sheet export, question-level analytics for intervention
- Dashboards, role-based access, audit trails, on-prem deployment, data retention rules

## Explicitly Cut
- Multi-teacher / department workflows — out of scope; this PoC is a single teacher, single script
- Report generation and NSC achievement-level export — belongs to the later analytics story, not the kernel
- Any real infrastructure/deployment concerns — a hackathon PoC runs locally, not on department infrastructure
