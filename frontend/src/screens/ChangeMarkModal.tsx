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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4 z-30">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-7 max-w-sm w-full space-y-5">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-navy">Change Mark</h3>
          <p className="text-sm text-slate-500">
            AI proposed <span className="font-semibold text-navy">{result.proposed_mark} / {result.max_mark}</span> for Question{" "}
            {result.question_number}.
          </p>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Teacher's mark (out of {result.max_mark})
          <input
            type="number"
            step="0.5"
            min="0"
            max={result.max_mark}
            className="mt-1.5 w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-base font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
            value={mark}
            onChange={(e) => setMark(e.target.value)}
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
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
