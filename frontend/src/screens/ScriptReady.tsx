import type { LearnerScript } from "../api/client";

interface ScriptReadyProps {
  script: LearnerScript;
  onStartMarking: () => void;
}

export default function ScriptReady({ script, onStartMarking }: ScriptReadyProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-10 max-w-lg w-full text-center space-y-6">
        <h2 className="text-xl font-semibold text-navy">Learner Script Ready</h2>
        <p className="text-gray-500 text-sm">
          {script.filename} is uploaded and ready, with {script.answers.length} answer(s)
          extracted.
        </p>
        <button
          onClick={onStartMarking}
          className="bg-navy text-white font-medium px-6 py-3 rounded-xl shadow hover:opacity-90 transition"
        >
          Start AI Marking
        </button>
      </div>
    </div>
  );
}
