import { useState } from "react";
import type { LearnerScript } from "../api/client";

interface ScriptReadyProps {
  scripts: LearnerScript[];
  markingProgress?: string | null;
  errorMessage?: string | null;
  onStartMarking: () => Promise<void>;
}

export default function ScriptReady({
  scripts,
  markingProgress,
  errorMessage,
  onStartMarking,
}: ScriptReadyProps) {
  const [marking, setMarking] = useState(false);
  const isBulk = scripts.length > 1;
  const first = scripts[0];

  async function handleClick() {
    setMarking(true);
    await onStartMarking();
    setMarking(false);
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-8 sm:p-10 max-w-lg w-full text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-confirmed flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>

        <div className="space-y-1.5">
          {isBulk && (
            <span className="inline-block text-xs font-bold uppercase tracking-wider bg-navy/10 text-navy px-3 py-1 rounded-full mb-1">
              Bulk Upload • {scripts.length} Scripts Ready
            </span>
          )}
          <h2 className="text-2xl font-bold text-navy">
            {isBulk ? "All Learner Scripts Ready" : "Learner Script Ready"}
          </h2>
          {isBulk ? (
            <p className="text-slate-500 text-sm">
              <span className="font-semibold text-navy">{scripts.length}</span> learner scripts are uploaded and ready. Verity will AI-mark all of them at once so you can review them back-to-back.
            </p>
          ) : (
            <p className="text-slate-500 text-sm">
              <span className="font-medium text-slate-700">{first.filename}</span> is uploaded and ready, with{" "}
              <span className="font-semibold text-navy">{first.answers.length}</span> answer(s) extracted.
            </p>
          )}
        </div>

        {isBulk && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left space-y-1.5 max-h-44 overflow-y-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Scripts in Batch ({scripts.length})
            </span>
            {scripts.map((s, idx) => (
              <div
                key={s.id}
                className="text-xs flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/70 text-slate-700"
              >
                <span className="truncate font-medium">
                  {idx + 1}. {s.filename}
                </span>
                <span className="text-slate-400 shrink-0 ml-2">
                  {s.answers.length} answers
                </span>
              </div>
            ))}
          </div>
        )}

        {errorMessage && (
          <div className="text-error text-sm bg-red-50 border border-red-200 rounded-xl p-3">
            {errorMessage}
          </div>
        )}

        <button
          onClick={handleClick}
          disabled={marking}
          className="w-full bg-navy text-white font-semibold px-6 py-3.5 rounded-xl shadow-md shadow-navy/15 hover:opacity-95 transition disabled:opacity-50"
        >
          {marking
            ? markingProgress || "Marking in progress…"
            : isBulk
            ? `Start Bulk AI Marking (${scripts.length} Scripts) →`
            : "Start AI Marking →"}
        </button>

        {marking && (
          <p className="text-slate-400 text-xs animate-pulse">
            {isBulk
              ? "Verity is AI-marking every script in your batch — then you can review and sign off each one."
              : "Verity is marking each question — this can take a moment."}
          </p>
        )}
      </div>
    </div>
  );
}

