import { useRef, useState } from "react";
import { uploadMemorandum, type Memorandum } from "../api/client";

interface MemoUploadProps {
  onExtracted: (memo: Memorandum) => void;
}

export default function MemoUpload({ onExtracted }: MemoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function processFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const memo = await uploadMemorandum(file);
      onExtracted(memo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-8 sm:p-10 max-w-xl w-full space-y-6">
        <div className="space-y-1.5 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-navy/60">
            Step 1 of 5
          </span>
          <h2 className="text-2xl font-bold text-navy">Upload Memorandum</h2>
          <p className="text-slate-500 text-sm">
            Choose your marking memorandum (.pdf or .txt). Verity will read the questions and marks for you.
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !loading && inputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragActive
              ? "border-navy bg-navy/5"
              : "border-slate-300 hover:border-navy/60 hover:bg-slate-50/70"
          } ${loading ? "opacity-60 pointer-events-none" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-navy/10 text-navy flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            {loading ? "⋯" : "↑"}
          </div>
          {loading ? (
            <div className="space-y-2">
              <p className="text-navy font-semibold text-sm animate-pulse">
                Reading your memorandum…
              </p>
              <p className="text-xs text-slate-400">
                Finding each question, expected answer, and mark
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-navy">
                Click to choose a file, or drag and drop it here
              </p>
              <p className="text-xs text-slate-400">
                Accepts <span className="font-semibold text-slate-600">.pdf</span> or{" "}
                <span className="font-semibold text-slate-600">.txt</span> files
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="text-error text-sm bg-red-50 border border-red-200 rounded-xl p-3.5 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
