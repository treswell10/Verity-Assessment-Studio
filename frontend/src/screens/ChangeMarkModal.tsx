import { useState } from "react";
import { updateMarkingResult, type MarkingResult } from "../api/client";

interface ChangeMarkModalProps {
  scriptId: number;
  result: MarkingResult;
  onCancel: () => void;
  onSaved: (result: MarkingResult) => void;
}

export default function ChangeMarkModal({
  scriptId,
  result,
  onCancel,
  onSaved,
}: ChangeMarkModalProps) {
  const [mark, setMark] = useState(String(result.final_mark ?? result.proposed_mark));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMarkingResult(
        scriptId,
        result.question_number,
        parseFloat(mark) || 0,
        "changed"
      );
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-10">
      <div className="bg-white rounded-2xl shadow-md p-6 max-w-sm w-full space-y-4">
        <h3 className="text-lg font-semibold text-navy">Change Mark</h3>
        <p className="text-sm text-gray-500">
          AI proposed {result.proposed_mark} / {result.max_mark} for question{" "}
          {result.question_number}.
        </p>

        <label className="block text-sm text-gray-600">
          Teacher's mark (out of {result.max_mark})
          <input
            type="number"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={mark}
            onChange={(e) => setMark(e.target.value)}
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
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
