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

function App() {
  const [step, setStep] = useState<Step>("landing");
  const [memorandum, setMemorandum] = useState<Memorandum | null>(null);
  const [script, setScript] = useState<LearnerScript | null>(null);
  const [results, setResults] = useState<MarkingResult[]>([]);
  const [startError, setStartError] = useState<string | null>(null);
  const [focusQuestion, setFocusQuestion] = useState<string | undefined>(undefined);
  const [summary, setSummary] = useState<ScriptSummary | null>(null);
  const [finalResult, setFinalResult] = useState<SignOffResult | null>(null);

  useEffect(() => {
    if (step === "complete" && script) {
      getSummary(script.id).then(setSummary);
    }
  }, [step, script]);

  if (step === "landing") {
    return <Landing onUploadClick={() => setStep("upload")} />;
  }
  if (step === "upload") {
    return (
      <MemoUpload
        onExtracted={(memo) => {
          setMemorandum(memo);
          setStep("check");
        }}
      />
    );
  }
  if (step === "check" && memorandum) {
    return (
      <MemoCheck
        memorandum={memorandum}
        onMemoUpdated={setMemorandum}
        onConfirmed={(memo) => {
          setMemorandum(memo);
          setStep("scriptUpload");
        }}
      />
    );
  }
  if (step === "scriptUpload" && memorandum) {
    return (
      <ScriptUpload
        memorandumId={memorandum.id}
        onReady={(s) => {
          setScript(s);
          setStep("scriptReady");
        }}
      />
    );
  }
  if (step === "scriptReady" && script) {
    return (
      <ScriptReady
        script={script}
        onStartMarking={async () => {
          setStartError(null);
          try {
            const r = await startMarking(script.id);
            setResults(r);
            setStep("marking");
          } catch (err) {
            setStartError(err instanceof Error ? err.message : "Could not start marking");
          }
        }}
      />
    );
  }
  if (step === "marking" && script) {
    return (
      <div>
        {startError && <p className="text-error text-sm text-center p-4">{startError}</p>}
        <MarkingScreen
          scriptId={script.id}
          results={results}
          answers={script.answers}
          focusQuestion={focusQuestion}
          onAllReviewed={(r) => {
            setResults(r);
            setFocusQuestion(undefined);
            setStep("complete");
          }}
        />
      </div>
    );
  }
  if (step === "complete" && script && summary) {
    return (
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
    );
  }
  if (step === "finalised" && finalResult) {
    return <MarkFinalised result={finalResult} />;
  }
  return null;
}

export default App
