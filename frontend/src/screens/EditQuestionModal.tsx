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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-10">
      <div className="bg-white rounded-2xl shadow-md p-6 max-w-md w-full space-y-4">
        <h3 className="text-lg font-semibold text-navy">Edit Question</h3>

        <label className="block text-sm text-gray-600">
          Question number
          <input
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={questionNumber}
            onChange={(e) => setQuestionNumber(e.target.value)}
          />
        </label>

        <label className="block text-sm text-gray-600">
          Expected answer
          <textarea
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            rows={3}
            value={expectedAnswer}
            onChange={(e) => setExpectedAnswer(e.target.value)}
          />
        </label>

        <label className="block text-sm text-gray-600">
          Marks
          <input
            type="number"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={maxMark}
            onChange={(e) => setMaxMark(e.target.value)}
          />
        </label>

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-navy border border-navy/30 hover:bg-navy/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-navy text-white hover:opacity-90"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
