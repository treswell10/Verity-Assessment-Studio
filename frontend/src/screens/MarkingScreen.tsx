import { useState } from "react";
import {
  updateMarkingResult,
  CONFIDENCE_THRESHOLD,
  type MarkingResult,
  type ScriptAnswer,
} from "../api/client";
import ChangeMarkModal from "./ChangeMarkModal";

interface MarkingScreenProps {
  scriptId: number;
  results: MarkingResult[];
  answers: ScriptAnswer[];
  onAllReviewed: (results: MarkingResult[]) => void;
}

export default function MarkingScreen({
  scriptId,
  results: initialResults,
  answers,
  onAllReviewed,
}: MarkingScreenProps) {
  const [results, setResults] = useState(initialResults);
  const [index, setIndex] = useState(0);
  const [showChangeMark, setShowChangeMark] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = results[index];
  const learnerAnswer =
    answers.find((a) => a.question_number === current.question_number)?.answer_text ?? "";
  const isEscalated = current.status === "proposed" && current.confidence < CONFIDENCE_THRESHOLD;

  function advance(updated: MarkingResult) {
    const next = results.map((r) => (r.question_number === updated.question_number ? updated : r));
    setResults(next);
    if (index + 1 < results.length) {
      setIndex(index + 1);
    } else {
      onAllReviewed(next);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      const updated = await updateMarkingResult(
        scriptId,
        current.question_number,
        current.proposed_mark,
        "confirmed"
      );
      advance(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Question {current.question_number} — Learner's Answer
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap text-sm">
            {learnerAnswer || "(no answer given)"}
          </p>
        </div>

        <div
          className={`rounded-2xl shadow-md p-6 space-y-4 ${
            isEscalated ? "bg-amber-50 border-2 border-review" : "bg-white"
          }`}
        >
          {isEscalated && (
            <p className="text-review font-semibold text-sm">⚠️ Teacher Review Needed</p>
          )}
          <div className="flex justify-between items-baseline">
            <span className="font-medium text-navy">
              Proposed mark: {current.proposed_mark} / {current.max_mark}
            </span>
            <span className="text-sm text-gray-500">{current.confidence}% confidence</span>
          </div>
          <p className="text-gray-700 text-sm">{current.reason}</p>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowChangeMark(true)}
              className="px-4 py-2 rounded-lg text-navy border border-navy/30 hover:bg-navy/5"
            >
              Change Mark
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="px-4 py-2 rounded-lg bg-confirmed text-white hover:opacity-90"
            >
              {isEscalated ? "Confirm AI Mark" : "Confirm"}
            </button>
          </div>
        </div>
      </div>

      {showChangeMark && (
        <ChangeMarkModal
          scriptId={scriptId}
          result={current}
          onCancel={() => setShowChangeMark(false)}
          onSaved={(updated) => {
            setShowChangeMark(false);
            advance(updated);
          }}
        />
      )}
    </div>
  );
}
