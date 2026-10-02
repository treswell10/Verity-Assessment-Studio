import { useRef, useState } from "react";
import { uploadScript, type LearnerScript } from "../api/client";

interface ScriptUploadProps {
  memorandumId: number;
  onReady: (script: LearnerScript) => void;
}

export default function ScriptUpload({ memorandumId, onReady }: ScriptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const script = await uploadScript(memorandumId, file);
      onReady(script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-10 max-w-lg w-full text-center space-y-6">
        <h2 className="text-xl font-semibold text-navy">Upload Learner Script</h2>
        <p className="text-gray-500 text-sm">
          Upload one learner's completed assessment.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.pdf"
          onChange={handleFileChange}
          disabled={loading}
          className="block mx-auto text-sm"
        />
        {loading && <p className="text-navy/70 text-sm">Reading script…</p>}
        {error && (
          <p className="text-error text-sm bg-red-50 rounded-lg p-3">{error}</p>
        )}
      </div>
    </div>
  );
}
