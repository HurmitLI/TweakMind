import { Link } from "react-router-dom";
import type { DecisionReportSelectionSummary } from "../../core/report/DecisionReportTypes";

interface ReportSelectionPanelProps {
  summary: DecisionReportSelectionSummary;
}

export function ReportSelectionPanel({ summary }: ReportSelectionPanelProps) {
  const canApply = summary.applyState === "ready" && summary.applyTargetId;

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Selected</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{summary.selectedCount}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Estimated execution time</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{summary.estimatedExecutionTime}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Highest selected risk</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{summary.highestSelectedRisk}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">Apply status</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{summary.applyMessage}</p>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        {canApply ? (
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            to={`/confirm/${summary.applyTargetId}?from=report`}
          >
            Apply Selected
          </Link>
        ) : (
          <button
            className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-lg bg-slate-200 px-5 text-sm font-semibold text-slate-600"
            disabled
            type="button"
          >
            Apply Selected
          </button>
        )}
      </div>
    </section>
  );
}
