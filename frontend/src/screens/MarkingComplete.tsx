import { useState } from "react";
import { signOffScript, type ScriptSummary, type SignOffResult } from "../api/client";

interface MarkingCompleteProps {
  scriptId: number;
  summary: ScriptSummary;
  onReviewQuestion: (questionNumber: string) => void;
  onSignedOff: (result: SignOffResult) => void;
}

export default function MarkingComplete({
  scriptId,
  summary,
  onReviewQuestion,
  onSignedOff,
}: MarkingCompleteProps) {
  const [unresolved, setUnresolved] = useState(summary.unresolved_questions);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOff() {
    setSigning(true);
    setError(null);
    try {
      const result = await signOffScript(scriptId);
      onSignedOff(result);
    } catch (err) {
      const e = err as Error & { unresolved_questions?: string[] };
      if (e.unresolved_questions) {
        setUnresolved(e.unresolved_questions);
      }
      setError(e.message || "Could not sign off");
    } finally {
      setSigning(false);
    }
  }

  const allReviewed = unresolved.length === 0;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-10 max-w-lg w-full space-y-6 text-center">
        <h2 className="text-xl font-semibold text-navy">Marking Complete</h2>

        <div>
          <p className="text-3xl font-semibold text-navy">
            {summary.final_score} / {summary.max_score}
          </p>
          <p className="text-gray-500 text-sm mt-1">{summary.final_percentage}%</p>
        </div>

        <ul className="text-sm text-gray-700 space-y-2 text-left">
          <li className="flex items-center gap-2">
            <span>{allReviewed ? "✅" : "⚠️"}</span>
            <span>All questions reviewed</span>
          </li>
          <li className="flex items-center gap-2">
            <span>✅</span>
            <span>Any AI suggestions changed by the teacher are included</span>
          </li>
        </ul>

        {!allReviewed && (
          <div className="bg-amber-50 border-2 border-review rounded-xl p-4 text-left space-y-2">
            <p className="text-review font-semibold text-sm">
              ⚠️ {unresolved.length} question(s) still need your review
            </p>
            <div className="flex flex-wrap gap-2">
              {unresolved.map((q) => (
                <button
                  key={q}
                  onClick={() => onReviewQuestion(q)}
                  className="px-3 py-1.5 rounded-lg text-sm text-navy border border-navy/30 hover:bg-navy/5"
                >
                  Review Question {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-error text-sm">{error}</p>}

        <button
          onClick={handleSignOff}
          disabled={signing || !allReviewed}
          className="w-full px-4 py-3 rounded-lg bg-navy text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {signing ? "Signing Off…" : "Sign Off Final Mark"}
        </button>
      </div>
    </div>
  );
}
