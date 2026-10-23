import { useEffect, useState } from "react";
import Landing from "./screens/Landing";
import MemoUpload from "./screens/MemoUpload";
import MemoCheck from "./screens/MemoCheck";
import ScriptUpload from "./screens/ScriptUpload";
import ScriptReady from "./screens/ScriptReady";
import MarkingScreen from "./screens/MarkingScreen";
import MarkingComplete from "./screens/MarkingComplete";
import MarkFinalised from "./screens/MarkFinalised";
import {
  startMarking,
  getSummary,
  type LearnerScript,
  type MarkingResult,
  type Memorandum,
  type ScriptSummary,
  type SignOffResult,
} from "./api/client";

type Step =
  | "landing"
  | "upload"
  | "check"
  | "scriptUpload"
  | "scriptReady"
  | "marking"
  | "complete"
  | "finalised";

const WORKFLOW_STEPS: { key: Step[]; label: string }[] = [
  { key: ["upload"], label: "1. Upload Memo" },
  { key: ["check"], label: "2. Check Memo" },
  { key: ["scriptUpload", "scriptReady"], label: "3. Upload Script" },
  { key: ["marking"], label: "4. Review Marks" },
  { key: ["complete", "finalised"], label: "5. Final Sign-Off" },
];

function App() {
  const [step, setStep] = useState<Step>("landing");
  const [memorandum, setMemorandum] = useState<Memorandum | null>(null);
  const [scriptQueue, setScriptQueue] = useState<LearnerScript[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [resultsByScript, setResultsByScript] = useState<Record<number, MarkingResult[]>>({});
  const [markingProgress, setMarkingProgress] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [focusQuestion, setFocusQuestion] = useState<string | undefined>(undefined);
  const [summary, setSummary] = useState<ScriptSummary | null>(null);
  const [finalResult, setFinalResult] = useState<SignOffResult | null>(null);

  const script = scriptQueue[queueIndex] ?? null;
  const results = script ? resultsByScript[script.id] ?? [] : [];

  useEffect(() => {
    if (step === "complete" && script) {
      getSummary(script.id).then(setSummary);
    }
  }, [step, script]);

  const activeStageIndex = WORKFLOW_STEPS.findIndex((s) => s.key.includes(step));

  function handleResetToNewScript() {
    setScriptQueue([]);
    setQueueIndex(0);
    setResultsByScript({});
    setMarkingProgress(null);
    setSummary(null);
    setFinalResult(null);
    setFocusQuestion(undefined);
    setStep("scriptUpload");
  }

  function handleNextQueuedScript() {
    setQueueIndex((prev) => prev + 1);
    setSummary(null);
    setFinalResult(null);
    setFocusQuestion(undefined);
    setStep("marking");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {step !== "landing" && (
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/85 border-b border-slate-200/80 px-6 py-3.5">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => setStep("landing")}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-navy text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition">
                V
              </div>
              <div>
                <span className="font-bold text-navy tracking-tight text-sm block leading-none">
                  VERITY ASSESSMENT STUDIO
                </span>
                <span className="text-[11px] text-slate-500">
                  AI Marking with the Teacher in Control
                </span>
              </div>
            </button>

            <nav className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
              {WORKFLOW_STEPS.map((stage, idx) => {
                const isCurrent = idx === activeStageIndex;
                const isDone = idx < activeStageIndex;
                return (
                  <div key={stage.label} className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${
                        isCurrent
                          ? "bg-navy text-white shadow-sm"
                          : isDone
                          ? "bg-emerald-50 text-confirmed border border-emerald-200"
                          : "text-slate-400 bg-slate-100/70"
                      }`}
                    >
                      {isDone ? `✓ ${stage.label.slice(3)}` : stage.label}
                    </span>
                    {idx < WORKFLOW_STEPS.length - 1 && (
                      <span className="text-slate-300 text-xs hidden md:inline">→</span>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col">
        {step === "landing" && <Landing onUploadClick={() => setStep("upload")} />}

        {step === "upload" && (
          <MemoUpload
            onExtracted={(memo) => {
              setMemorandum(memo);
              setStep("check");
            }}
          />
        )}

        {step === "check" && memorandum && (
          <MemoCheck
            memorandum={memorandum}
            onMemoUpdated={setMemorandum}
            onConfirmed={(memo) => {
              setMemorandum(memo);
              setStep("scriptUpload");
            }}
          />
        )}

        {step === "scriptUpload" && memorandum && (
          <ScriptUpload
            memorandumId={memorandum.id}
            onReady={(scripts) => {
              setScriptQueue(scripts);
              setQueueIndex(0);
              setStep("scriptReady");
            }}
          />
        )}

        {step === "scriptReady" && scriptQueue.length > 0 && (
          <ScriptReady
            scripts={scriptQueue}
            markingProgress={markingProgress}
            errorMessage={startError}
            onStartMarking={async () => {
              setStartError(null);
              try {
                const map: Record<number, MarkingResult[]> = {};
                for (let i = 0; i < scriptQueue.length; i++) {
                  const s = scriptQueue[i];
                  setMarkingProgress(
                    scriptQueue.length > 1
                      ? `AI Marking script ${i + 1} of ${scriptQueue.length}: ${s.filename}…`
                      : `Marking ${s.filename}…`
                  );
                  map[s.id] = await startMarking(s.id);
                }
                setResultsByScript(map);
                setMarkingProgress(null);
                setQueueIndex(0);
                setStep("marking");
              } catch (err) {
                setMarkingProgress(null);
                setStartError(
                  err instanceof Error ? err.message : "Could not start marking"
                );
              }
            }}
          />
        )}

        {step === "marking" && script && (
          <MarkingScreen
            key={script.id}
            scriptId={script.id}
            scriptFilename={script.filename}
            scriptPosition={queueIndex + 1}
            scriptTotal={scriptQueue.length}
            results={results}
            answers={script.answers}
            questions={memorandum?.questions ?? []}
            focusQuestion={focusQuestion}
            onAllReviewed={(r) => {
              setResultsByScript((prev) => ({ ...prev, [script.id]: r }));
              setFocusQuestion(undefined);
              setStep("complete");
            }}
          />
        )}

        {step === "complete" && script && summary && (
          <MarkingComplete
            scriptId={script.id}
            summary={summary}
            onReviewQuestion={(questionNumber) => {
              setFocusQuestion(questionNumber);
              setStep("marking");
            }}
            onSignedOff={(result) => {
              setFinalResult(result);
              setStep("finalised");
            }}
          />
        )}

        {step === "finalised" && finalResult && script && memorandum && (
          <MarkFinalised
            scriptId={script.id}
            memorandumId={memorandum.id}
            result={finalResult}
            remainingQueueCount={Math.max(0, scriptQueue.length - (queueIndex + 1))}
            onNextQueuedScript={handleNextQueuedScript}
            onMarkAnother={handleResetToNewScript}
          />
        )}
      </main>
    </div>
  );
}

export default App;
