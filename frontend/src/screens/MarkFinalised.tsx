import { useEffect, useState } from "react";
import {
  getMarksheet,
  getMarksheetCsvUrl,
  getMarksheetXlsxUrl,
  getMarkedScriptReportUrl,
  type Marksheet,
  type SignOffResult,
} from "../api/client";

interface MarkFinalisedProps {
  scriptId: number;
  memorandumId: number;
  result: SignOffResult;
  remainingQueueCount?: number;
  onNextQueuedScript?: () => void;
  onMarkAnother?: () => void;
}

export default function MarkFinalised({
  scriptId,
  memorandumId,
  result,
  remainingQueueCount = 0,
  onNextQueuedScript,
  onMarkAnother,
}: MarkFinalisedProps) {
  const [marksheet, setMarksheet] = useState<Marksheet | null>(null);

  useEffect(() => {
    getMarksheet(memorandumId).then(setMarksheet).catch(() => {});
  }, [memorandumId, scriptId]);

  const classAveragePct =
    marksheet && marksheet.scripts.length > 0
      ? Math.round(
          (marksheet.scripts.reduce((acc, s) => acc + s.final_percentage, 0) /
            marksheet.scripts.length) *
            10
        ) / 10
      : null;

  return (
    <div className="flex-1 px-4 py-10 max-w-5xl mx-auto w-full space-y-8">
      {/* Finalised Summary Card */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-8 sm:p-10 max-w-2xl mx-auto w-full space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-confirmed flex items-center justify-center mx-auto text-3xl font-bold shadow-sm">
          ✓
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-confirmed">
            Teacher Approved
          </span>
          <h2 className="text-2xl font-bold text-navy">✅ Mark Finalised</h2>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-1">
          <p className="text-4xl font-extrabold text-navy">
            {result.final_score}
            {marksheet ? ` / ${marksheet.max_score}` : ""}
          </p>
          <p className="text-sm font-semibold text-confirmed">
            {result.final_percentage}% Final Score
          </p>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed">
          This mark has been reviewed and approved by the teacher. You can now download the learner's marked script or export the Excel marksheet.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <a
            href={getMarkedScriptReportUrl(scriptId)}
            download
            className="flex-1 inline-flex items-center justify-center gap-2 bg-confirmed text-white font-semibold px-5 py-3.5 rounded-xl shadow-sm hover:opacity-95 transition text-sm"
          >
            <span>⬇ Download Marked Script (for Learner)</span>
          </a>

          {remainingQueueCount > 0 && onNextQueuedScript ? (
            <button
              onClick={onNextQueuedScript}
              className="flex-1 bg-navy text-white font-semibold px-5 py-3.5 rounded-xl shadow-md hover:opacity-95 transition text-sm"
            >
              Review Next Marked Script ({remainingQueueCount} left) →
            </button>
          ) : (
            onMarkAnother && (
              <button
                onClick={onMarkAnother}
                className="flex-1 bg-navy text-white font-semibold px-5 py-3.5 rounded-xl shadow-md hover:opacity-95 transition text-sm"
              >
                Upload More Scripts →
              </button>
            )
          )}
        </div>
      </div>

      {/* Modern Excel Class Marksheet Table */}
      {marksheet && marksheet.scripts.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-navy">
                  Class Marksheet ({marksheet.scripts.length}{" "}
                  {marksheet.scripts.length === 1 ? "script" : "scripts"} marked)
                </h3>
                {classAveragePct !== null && (
                  <span className="bg-emerald-50 text-confirmed border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Class Avg: {classAveragePct}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Memorandum: <span className="font-medium text-slate-700">{marksheet.memorandum_filename}</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <a
                href={getMarksheetXlsxUrl(memorandumId)}
                download
                className="inline-flex items-center gap-2 bg-confirmed text-white hover:opacity-95 font-semibold px-4 py-2.5 rounded-xl text-xs shadow-sm transition"
              >
                <span>📗 Download Modern Excel Marksheet (.xlsx)</span>
              </a>
              <a
                href={getMarksheetCsvUrl(memorandumId)}
                download
                className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold px-3.5 py-2.5 rounded-xl text-xs transition"
              >
                <span>CSV</span>
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 pr-4">Learner Script</th>
                  {marksheet.question_numbers.map((q) => (
                    <th key={q} className="py-3 px-2 text-center">
                      Q{q}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-right">%</th>
                  <th className="py-3 pl-3 text-right">Learner Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marksheet.scripts.map((row) => (
                  <tr
                    key={row.script_id}
                    className={
                      row.script_id === scriptId
                        ? "bg-emerald-50/40 font-medium"
                        : "hover:bg-slate-50/80"
                    }
                  >
                    <td className="py-3.5 pr-4 text-navy font-semibold">
                      {row.filename}
                    </td>
                    {marksheet.question_numbers.map((q) => (
                      <td key={q} className="py-3.5 px-2 text-center text-slate-600">
                        {row.question_marks[q] ?? "—"}
                      </td>
                    ))}
                    <td className="py-3.5 px-3 text-right font-bold text-navy">
                      {row.final_score} / {row.max_score}
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold text-confirmed">
                      {row.final_percentage}%
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <a
                        href={getMarkedScriptReportUrl(row.script_id)}
                        download
                        className="inline-flex items-center gap-1 text-xs font-semibold text-navy border border-slate-300 rounded-lg px-2.5 py-1.5 hover:bg-navy hover:text-white hover:border-navy transition"
                      >
                        ⬇ Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
