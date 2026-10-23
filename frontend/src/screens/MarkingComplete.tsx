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
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-8 sm:p-10 max-w-lg w-full space-y-6 text-center">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-navy/60">
            Step 5 of 5 • Final Review
          </span>
          <h2 className="text-2xl font-bold text-navy">Marking Complete</h2>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-1">
          <p className="text-4xl font-extrabold text-navy">
            {summary.final_score} / {summary.max_score}
          </p>
          <p className="text-confirmed font-semibold text-sm">
            {summary.final_percentage}% Score
          </p>
        </div>

        <ul className="text-sm text-slate-700 space-y-2.5 text-left bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4">
          <li className="flex items-center gap-2.5">
            <span>{allReviewed ? "✅" : "⚠️"}</span>
            <span className="font-medium">All questions reviewed</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span>✅</span>
            <span className="font-medium">Any AI suggestions changed by the teacher are included</span>
          </li>
        </ul>

        {!allReviewed && (
          <div className="bg-amber-50 border-2 border-review rounded-2xl p-4 text-left space-y-3">
            <p className="text-review font-semibold text-sm">
              ⚠️ {unresolved.length} question(s) still need your review
            </p>
            <div className="flex flex-wrap gap-2">
              {unresolved.map((q) => (
                <button
                  key={q}
                  onClick={() => onReviewQuestion(q)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-navy bg-white border border-navy/30 hover:bg-navy hover:text-white transition"
                >
                  Review Question {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-error text-sm bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </p>
        )}

        <button
          onClick={handleSignOff}
          disabled={signing || !allReviewed}
          className="w-full px-5 py-3.5 rounded-xl bg-navy text-white font-semibold shadow-md shadow-navy/15 hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {signing ? "Signing Off…" : "Sign Off Final Mark →"}
        </button>
      </div>
    </div>
  );
}
