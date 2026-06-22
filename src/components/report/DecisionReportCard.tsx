import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { DecisionReportItem } from "../../core/report/DecisionReportTypes";
import type { OptimizationRecommendation, OptimizationRiskLevel } from "../../types/optimization";

const recommendationStyles: Record<OptimizationRecommendation, string> = {
  Recommended: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Keep Default": "border-slate-200 bg-slate-100 text-slate-700",
  "Keep Enabled": "border-blue-200 bg-blue-50 text-blue-700",
  "Already Optimized": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Optional: "border-amber-200 bg-amber-50 text-amber-700"
};

const levelStyles: Record<OptimizationRiskLevel | "Unknown", string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-rose-200 bg-rose-50 text-rose-700",
  Unknown: "border-slate-200 bg-slate-50 text-slate-700"
};

function availabilityLabel(value: boolean) {
  return value ? "Yes" : "No";
}

interface DecisionReportCardProps {
  item: DecisionReportItem;
  selected: boolean;
  onToggleSelected: (id: DecisionReportItem["id"]) => void;
}

export function DecisionReportCard({ item, selected, onToggleSelected }: DecisionReportCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <input
              aria-label={`Select ${item.title}`}
              checked={selected}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              onChange={() => onToggleSelected(item.id)}
              type="checkbox"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-slate-950">{item.title}</h3>
                <span
                  className={[
                    "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    recommendationStyles[item.recommendation]
                  ].join(" ")}
                >
                  {item.recommendation}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                <span className="font-semibold text-slate-700">If ignored:</span> {item.ignoreConsequence}
              </p>
            </div>
          </div>
        </div>

        <Link
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          to={`/decision?id=${item.id}&from=report`}
        >
          Details
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current state</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">{item.currentState}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</dt>
          <dd className="mt-1">
            <span className={["inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold", levelStyles[item.riskLevel]].join(" ")}>
              {item.riskLevel}
            </span>
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected benefit</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">{item.expectedBenefit}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last applied</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">{item.lastAppliedLabel ?? "Never"}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Real apply</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">{availabilityLabel(item.canRealApply)}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">{availabilityLabel(item.canVerify)}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recovery</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">{availabilityLabel(item.canRecover)}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Runtime scan</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">{item.runtimeScanStatus}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detection confidence</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950">{item.detectionConfidence}</dd>
        </div>
      </dl>
    </article>
  );
}
