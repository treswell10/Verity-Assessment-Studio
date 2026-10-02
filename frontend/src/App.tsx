import { useState } from "react";
import Landing from "./screens/Landing";
import MemoUpload from "./screens/MemoUpload";
import MemoExtractedPreview from "./screens/MemoExtractedPreview";
import type { Memorandum } from "./api/client";

type Step = "landing" | "upload" | "preview";

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
          setStep("preview");
        }}
      />
    );
  }
  if (step === "preview" && memorandum) {
    return <MemoExtractedPreview memorandum={memorandum} />;
  }
  return null;
}

export default App
