import { useState } from "react";
import Landing from "./screens/Landing";
import MemoUpload from "./screens/MemoUpload";
import MemoCheck from "./screens/MemoCheck";
import type { Memorandum } from "./api/client";

type Step = "landing" | "upload" | "check" | "confirmed";

function App() {
  const [step, setStep] = useState<Step>("landing");
  const [memorandum, setMemorandum] = useState<Memorandum | null>(null);

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
          setStep("confirmed");
        }}
      />
    );
  }
  if (step === "confirmed" && memorandum) {
    // Learner script upload arrives in the next build slice.
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-lg w-full text-center space-y-3">
          <h2 className="text-xl font-semibold text-navy">Memorandum Confirmed</h2>
          <p className="text-gray-500 text-sm">
            {memorandum.filename} is confirmed with {memorandum.questions.length} question(s).
            Learner script upload comes next.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export default App
