import { useState } from "react";
import Landing from "./screens/Landing";
import MemoUpload from "./screens/MemoUpload";
import MemoCheck from "./screens/MemoCheck";
import ScriptUpload from "./screens/ScriptUpload";
import ScriptReady from "./screens/ScriptReady";
import MarkingScreen from "./screens/MarkingScreen";
import { startMarking, type LearnerScript, type MarkingResult, type Memorandum } from "./api/client";

type Step = "landing" | "upload" | "check" | "scriptUpload" | "scriptReady" | "marking" | "reviewed";

function App() {
  const [step, setStep] = useState<Step>("landing");
  const [memorandum, setMemorandum] = useState<Memorandum | null>(null);
  const [script, setScript] = useState<LearnerScript | null>(null);
  const [results, setResults] = useState<MarkingResult[]>([]);
  const [startError, setStartError] = useState<string | null>(null);

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
          onAllReviewed={(r) => {
            setResults(r);
            setStep("reviewed");
          }}
        />
      </div>
    );
  }
  if (step === "reviewed") {
    // Marking Complete and Sign Off arrive in the next build slice.
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-lg w-full text-center space-y-3">
          <h2 className="text-xl font-semibold text-navy">All Questions Reviewed</h2>
          <p className="text-gray-500 text-sm">
            Marking Complete and Sign Off come next.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export default App
