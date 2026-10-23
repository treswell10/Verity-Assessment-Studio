import { useState } from "react";
import { confirmMemorandum, getMemorandum, type Memorandum } from "../api/client";
import EditQuestionModal from "./EditQuestionModal";

interface MemoCheckProps {
  memorandum: Memorandum;
  onMemoUpdated: (memo: Memorandum) => void;
  onConfirmed: (memo: Memorandum) => void;
}

export default function MemoCheck({
  memorandum,
  onMemoUpdated,
  onConfirmed,
}: MemoCheckProps) {
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editingQuestion =
    memorandum.questions.find((q) => q.id === editingQuestionId) ?? null;

  const totalMarks = memorandum.questions.reduce((acc, q) => acc + q.max_mark, 0);

  async function handleContinue() {
    setConfirming(true);
    setError(null);
    try {
      const confirmed = await confirmMemorandum(memorandum.id);
      onConfirmed(confirmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm memorandum");
      setConfirming(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-8 max-w-3xl w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-navy/60">
              Step 2 of 5
            </span>
            <h2 className="text-2xl font-bold text-navy mt-0.5">
              Check Your Memorandum
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Review what Verity found in <span className="font-medium text-slate-700">{memorandum.filename}</span>. Click Edit if you need to fix anything.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                Total Marks
              </span>
              <span className="text-lg font-extrabold text-navy">
                {totalMarks}
              </span>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">
                Questions
              </span>
              <span className="text-lg font-extrabold text-navy">
                {memorandum.questions.length}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {memorandum.questions.map((q) => (
            <div
              key={q.id}
              className="group border border-slate-200/90 hover:border-navy/30 rounded-2xl p-4 sm:p-5 flex justify-between items-start gap-4 transition bg-slate-50/40 hover:bg-white"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="bg-navy text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                    Q{q.question_number}
                  </span>
                  <span className="text-xs font-semibold text-navy bg-navy/10 px-2.5 py-1 rounded-lg">
                    {q.max_mark} {q.max_mark === 1 ? "mark" : "marks"}
                  </span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed pt-1">
                  {q.expected_answer}
                </p>
              </div>
              <button
                onClick={() => setEditingQuestionId(q.id)}
                className="shrink-0 text-xs font-semibold text-navy border border-slate-300 rounded-xl px-3.5 py-2 hover:bg-navy hover:text-white hover:border-navy transition"
              >
                Edit
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-error text-sm bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </p>
        )}

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Verity will use these answers to mark the learner's script.
          </span>
          <button
            onClick={handleContinue}
            disabled={confirming || memorandum.questions.length === 0}
            className="bg-navy text-white font-semibold px-6 py-3 rounded-xl shadow-md shadow-navy/15 hover:opacity-95 transition disabled:opacity-50"
          >
            {confirming ? "Confirming…" : "Looks Good, Continue →"}
          </button>
        </div>
      </div>

      {editingQuestion && (
        <EditQuestionModal
          memorandumId={memorandum.id}
          question={editingQuestion}
          onCancel={() => setEditingQuestionId(null)}
          onSaved={() => {
            setEditingQuestionId(null);
            getMemorandum(memorandum.id).then(onMemoUpdated);
          }}
        />
      )}
    </div>
  );
}
