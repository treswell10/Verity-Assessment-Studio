import type { Memorandum } from "../api/client";

interface MemoExtractedPreviewProps {
  memorandum: Memorandum;
}

/** Slice 1: read-only display of what Verity extracted. Editing arrives in slice 2. */
export default function MemoExtractedPreview({ memorandum }: MemoExtractedPreviewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-2xl w-full space-y-4">
        <h2 className="text-xl font-semibold text-navy">
          Extracted from {memorandum.filename}
        </h2>
        <div className="space-y-3">
          {memorandum.questions.map((q) => (
            <div key={q.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-navy">Question {q.question_number}</span>
                <span className="text-sm text-gray-500">{q.max_mark} marks</span>
              </div>
              <p className="text-gray-700 text-sm mt-1">{q.expected_answer}</p>
            </div>
          ))}
          {memorandum.questions.length === 0 && (
            <p className="text-gray-500 text-sm">No questions were extracted.</p>
          )}
        </div>
      </div>
    </div>
  );
}
