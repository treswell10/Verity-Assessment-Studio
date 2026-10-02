import { useState } from "react";
import Landing from "./screens/Landing";
import MemoUpload from "./screens/MemoUpload";
import MemoCheck from "./screens/MemoCheck";
import ScriptUpload from "./screens/ScriptUpload";
import ScriptReady from "./screens/ScriptReady";
import type { LearnerScript, Memorandum } from "./api/client";

type Step = "landing" | "upload" | "check" | "scriptUpload" | "scriptReady";

function App() {
  const [step, setStep] = useState<Step>("landing");
  const [memorandum, setMemorandum] = useState<Memorandum | null>(null);
  const [script, setScript] = useState<LearnerScript | null>(null);

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
        onStartMarking={() => {
          // AI marking arrives in the next build slice.
        }}
      />
    );
  }
  return null;
}

export default App
