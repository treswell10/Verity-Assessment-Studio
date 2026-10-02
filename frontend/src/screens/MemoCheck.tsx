import { useState } from "react";
import { confirmMemorandum, getMemorandum, type Memorandum } from "../api/client";
import EditQuestionModal from "./EditQuestionModal";

interface MemoCheckProps {
  memorandum: Memorandum;
  onMemoUpdated: (memo: Memorandum) => void;
  onConfirmed: (memo: Memorandum) => void;
}

export default function MemoCheck({ memorandum, onMemoUpdated, onConfirmed }: MemoCheckProps) {
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editingQuestion = memorandum.questions.find((q) => q.id === editingQuestionId) ?? null;

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
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-2xl w-full space-y-4">
        <h2 className="text-xl font-semibold text-navy">Check Your Memorandum</h2>
        <p className="text-sm text-gray-500">
          Review what Verity extracted from {memorandum.filename}. Edit anything that's wrong.
        </p>

        <div className="space-y-3">
          {memorandum.questions.map((q) => (
            <div
              key={q.id}
              className="border border-gray-200 rounded-xl p-4 flex justify-between items-start gap-4"
            >
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-medium text-navy">Question {q.question_number}</span>
                  <span className="text-sm text-gray-500">{q.max_mark} marks</span>
                </div>
                <p className="text-gray-700 text-sm mt-1">{q.expected_answer}</p>
              </div>
              <button
                onClick={() => setEditingQuestionId(q.id)}
                className="shrink-0 text-sm text-navy border border-navy/30 rounded-lg px-3 py-1.5 hover:bg-navy/5"
              >
                Edit
              </button>
            </div>
          ))}
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleContinue}
            disabled={confirming || memorandum.questions.length === 0}
            className="bg-navy text-white font-medium px-6 py-3 rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
          >
            {confirming ? "Confirming…" : "Looks Good, Continue"}
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
