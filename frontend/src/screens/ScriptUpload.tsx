import { useRef, useState } from "react";
import { uploadScript, type LearnerScript } from "../api/client";

interface ScriptUploadProps {
  memorandumId: number;
  onReady: (scripts: LearnerScript[]) => void;
}

export default function ScriptUpload({ memorandumId, onReady }: ScriptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function processFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setLoading(true);
    setError(null);
    const uploaded: LearnerScript[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        setProgressText(
          files.length === 1
            ? `Reading ${files[i].name}…`
            : `Reading script ${i + 1} of ${files.length}: ${files[i].name}…`
        );
        const script = await uploadScript(memorandumId, files[i]);
        uploaded.push(script);
      }
      onReady(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
      setProgressText("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-8 sm:p-10 max-w-xl w-full space-y-6">
        <div className="space-y-1.5 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-confirmed">
            Step 3 of 5 • Memorandum Confirmed ✓
          </span>
          <h2 className="text-2xl font-bold text-navy">Upload Learner Scripts</h2>
          <p className="text-slate-500 text-sm">
            Upload a single learner script or select multiple scripts in bulk (.pdf or .txt).
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
            multiple
            accept=".txt,.pdf"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-navy/10 text-navy flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            {loading ? "⋯" : "📄"}
          </div>
          {loading ? (
            <div className="space-y-1.5">
              <p className="text-navy font-semibold text-sm animate-pulse">
                {progressText || "Reading the learner's answers…"}
              </p>
              <p className="text-xs text-slate-400">
                Matching answers to your memorandum questions
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-navy">
                Click to choose one or more scripts, or drag and drop them here
              </p>
              <p className="text-xs text-slate-400">
                Bulk upload supported • Accepts <span className="font-semibold text-slate-600">.pdf</span> or{" "}
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
