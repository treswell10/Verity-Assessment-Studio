import { useState } from "react";
import {
  updateMarkingResult,
  CONFIDENCE_THRESHOLD,
  type MarkingResult,
  type MemoQuestion,
  type ScriptAnswer,
} from "../api/client";
import ChangeMarkModal from "./ChangeMarkModal";

interface MarkingScreenProps {
  scriptId: number;
  scriptFilename?: string;
  scriptPosition?: number;
  scriptTotal?: number;
  results: MarkingResult[];
  answers: ScriptAnswer[];
  questions?: MemoQuestion[];
  focusQuestion?: string;
  onAllReviewed: (results: MarkingResult[]) => void;
}

export default function MarkingScreen({
  scriptId,
  scriptFilename,
  scriptPosition = 1,
  scriptTotal = 1,
  results: initialResults,
  answers,
  questions = [],
  focusQuestion,
  onAllReviewed,
}: MarkingScreenProps) {
  const [results, setResults] = useState(initialResults);
  const [index, setIndex] = useState(() => {
    if (focusQuestion) {
      const found = initialResults.findIndex((r) => r.question_number === focusQuestion);
      if (found >= 0) return found;
    }
    return 0;
  });
  const [showChangeMark, setShowChangeMark] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = results[index];
  const learnerAnswer =
    answers.find((a) => a.question_number === current.question_number)?.answer_text ?? "";
  const expectedAnswer =
    questions.find((q) => q.question_number === current.question_number)?.expected_answer ?? "";
  const isEscalated = current.status === "proposed" && current.confidence < CONFIDENCE_THRESHOLD;

  const reviewedCount = results.filter((r) => r.status !== "proposed").length;

  function advance(updated: MarkingResult) {
    const next = results.map((r) => (r.question_number === updated.question_number ? updated : r));
    setResults(next);
    const stillUnresolved = next.findIndex((r) => r.status === "proposed");
    if (stillUnresolved === -1) {
      onAllReviewed(next);
    } else if (index + 1 < next.length && next[index + 1].status === "proposed") {
      setIndex(index + 1);
    } else {
      setIndex(stillUnresolved);
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
    <div className="flex-1 px-4 py-8 max-w-5xl mx-auto w-full space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {results.map((r, idx) => {
            const active = idx === index;
            const lowConf =
              r.status === "proposed" && r.confidence < CONFIDENCE_THRESHOLD;
            const done = r.status !== "proposed";
            return (
              <button
                key={r.question_number}
                onClick={() => setIndex(idx)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  active
                    ? "bg-navy text-white shadow-sm ring-2 ring-navy/20"
                    : done
                    ? "bg-emerald-50 text-confirmed border border-emerald-200"
                    : lowConf
                    ? "bg-amber-50 text-review border border-amber-300"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <span>Q{r.question_number}</span>
                {done && <span>✓</span>}
                {!done && lowConf && <span>!</span>}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {scriptFilename && (
            <span className="text-xs font-semibold text-navy bg-navy/10 px-3 py-1.5 rounded-xl">
              {scriptTotal > 1
                ? `Script ${scriptPosition} of ${scriptTotal}: ${scriptFilename}`
                : scriptFilename}
            </span>
          )}
          <div className="text-xs font-medium text-slate-500">
            Reviewed{" "}
            <span className="font-bold text-navy">{reviewedCount}</span> of{" "}
            <span className="font-bold text-navy">{results.length}</span> questions
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white rounded-3xl shadow-md shadow-slate-900/5 border border-slate-200/80 p-7 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-navy">
                Question {current.question_number} Comparison
              </span>
              <span className="text-xs font-semibold text-navy bg-slate-100 px-2.5 py-1 rounded-lg">
                {current.max_mark} {current.max_mark === 1 ? "mark" : "marks"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Memorandum (Expected Answer)
                </span>
                <p className="text-slate-800 whitespace-pre-wrap text-sm leading-relaxed">
                  {expectedAnswer || "(not available)"}
                </p>
              </div>

              <div className="bg-navy/[0.03] border border-navy/15 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy block">
                  Learner's Answer
                </span>
                <p className="text-slate-800 whitespace-pre-wrap text-sm leading-relaxed">
                  {learnerAnswer || "(no answer given)"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Out of {current.max_mark} marks</span>
            <span>Status: {current.status}</span>
          </div>
        </div>

        <div
          className={`rounded-3xl shadow-md p-7 flex flex-col justify-between space-y-6 transition ${
            isEscalated
              ? "bg-amber-50/90 border-2 border-review"
              : "bg-white border border-slate-200/80"
          }`}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Suggested Mark
              </span>
              {isEscalated ? (
                <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-review border border-review/30 text-xs font-bold px-3 py-1 rounded-full">
                  ⚠️ Teacher Review Needed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-confirmed border border-emerald-200 text-xs font-semibold px-3 py-1 rounded-full">
                  Ready to Confirm
                </span>
              )}
            </div>

            <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/70 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">
                  Proposed mark
                </span>
                <span className="text-3xl font-extrabold text-navy">
                  {current.final_mark ?? current.proposed_mark}{" "}
                  <span className="text-lg font-medium text-slate-400">
                    / {current.max_mark}
                  </span>
                </span>
              </div>

              <div className="text-right space-y-1.5">
                <span className="text-xs font-semibold text-slate-600 block">
                  {current.confidence}% confidence
                </span>
                <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      current.confidence < CONFIDENCE_THRESHOLD
                        ? "bg-review"
                        : "bg-confirmed"
                    }`}
                    style={{ width: `${Math.min(100, current.confidence)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Why Verity suggested this mark
              </span>
              <p className="text-slate-700 text-sm leading-relaxed">
                {current.reason}
              </p>
            </div>
          </div>

          {error && (
            <p className="text-error text-sm bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
            <button
              onClick={() => setShowChangeMark(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-navy bg-white border border-slate-300 hover:border-navy transition"
            >
              Change Mark
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-confirmed text-white shadow-sm hover:opacity-95 transition disabled:opacity-50"
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
