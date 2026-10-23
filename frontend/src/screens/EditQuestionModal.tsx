import { useState } from "react";
import { updateMemoQuestion, type MemoQuestion } from "../api/client";

interface EditQuestionModalProps {
  memorandumId: number;
  question: MemoQuestion;
  onCancel: () => void;
  onSaved: () => void;
}

export default function EditQuestionModal({
  memorandumId,
  question,
  onCancel,
  onSaved,
}: EditQuestionModalProps) {
  const [questionNumber, setQuestionNumber] = useState(question.question_number);
  const [expectedAnswer, setExpectedAnswer] = useState(question.expected_answer);
  const [maxMark, setMaxMark] = useState(question.max_mark.toString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateMemoQuestion(memorandumId, question.id, {
        question_number: questionNumber,
        expected_answer: expectedAnswer,
        max_mark: parseFloat(maxMark) || 0,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4 z-30">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-7 max-w-md w-full space-y-4">
        <div>
          <h3 className="text-xl font-bold text-navy">Edit Question</h3>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Question number
          <input
            className="mt-1.5 w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
            value={questionNumber}
            onChange={(e) => setQuestionNumber(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Expected answer
          <textarea
            className="mt-1.5 w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
            rows={4}
            value={expectedAnswer}
            onChange={(e) => setExpectedAnswer(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Marks
          <input
            type="number"
            className="mt-1.5 w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
            value={maxMark}
            onChange={(e) => setMaxMark(e.target.value)}
          />
        </label>

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-navy border border-slate-300 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-navy text-white shadow-sm hover:opacity-95 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
