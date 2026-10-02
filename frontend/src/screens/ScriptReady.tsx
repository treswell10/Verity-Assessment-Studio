import { useState } from "react";
import type { LearnerScript } from "../api/client";

interface ScriptReadyProps {
  script: LearnerScript;
  onStartMarking: () => Promise<void>;
}

export default function ScriptReady({ script, onStartMarking }: ScriptReadyProps) {
  const [marking, setMarking] = useState(false);

  async function handleClick() {
    setMarking(true);
    await onStartMarking();
    // On failure, App.tsx surfaces the error and stays on this screen — reset so
    // the teacher can retry instead of seeing a permanently disabled button.
    setMarking(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-10 max-w-lg w-full text-center space-y-6">
        <h2 className="text-xl font-semibold text-navy">Learner Script Ready</h2>
        <p className="text-gray-500 text-sm">
          {script.filename} is uploaded and ready, with {script.answers.length} answer(s)
          extracted.
        </p>
        <button
          onClick={handleClick}
          disabled={marking}
          className="bg-navy text-white font-medium px-6 py-3 rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
        >
          {marking ? "Marking in progress…" : "Start AI Marking"}
        </button>
        {marking && (
          <p className="text-gray-400 text-xs">
            Verity is marking each question — this can take a minute or two.
          </p>
        )}
      </div>
    </div>
  );
}

