import type { SignOffResult } from "../api/client";

interface MarkFinalisedProps {
  result: SignOffResult;
}

export default function MarkFinalised({ result }: MarkFinalisedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-10 max-w-lg w-full space-y-4 text-center">
        <h2 className="text-xl font-semibold text-confirmed">✅ Mark Finalised</h2>
        <p className="text-3xl font-semibold text-navy">{result.final_score}</p>
        <p className="text-gray-500 text-sm">{result.final_percentage}%</p>
        <p className="text-gray-600 text-sm">
          This mark has been reviewed and approved by the educator. The script is now final.
        </p>
      </div>
    </div>
  );
}
