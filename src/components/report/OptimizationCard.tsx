import { ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { RecommendationResult } from "../../core/recommendation/RecommendationResult";
import type { OptimizationBenefitLevel, OptimizationDefinition, OptimizationRecommendation, OptimizationRiskLevel } from "../../types/optimization";

interface OptimizationCardProps {
  optimization: OptimizationDefinition;
  recommendation: RecommendationResult;
  defaultOpen?: boolean;
}

const recommendationStyles: Record<OptimizationRecommendation, string> = {
  Recommended: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Keep Default": "border-slate-200 bg-slate-100 text-slate-700",
  "Keep Enabled": "border-blue-200 bg-blue-50 text-blue-700",
  "Already Optimized": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Optional: "border-amber-200 bg-amber-50 text-amber-700"
};

const levelStyles: Record<OptimizationRiskLevel | OptimizationBenefitLevel, string> = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-rose-50 text-rose-700 border-rose-200"
};

const impactLabels = [
  ["Performance", "performance"],
  ["Privacy", "privacy"],
  ["Gaming", "gaming"],
  ["Battery", "battery"]
] as const;

export function OptimizationCard({ optimization, recommendation, defaultOpen = false }: OptimizationCardProps) {
  return (
    <details
      className="group rounded-lg border border-slate-200 bg-white/95 shadow-sm transition open:border-blue-200 open:shadow-md"
      open={defaultOpen}
    >
      <summary className="grid cursor-pointer list-none gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">{optimization.title}</h3>
            <span
              className={[
                "rounded-full border px-3 py-1 text-xs font-semibold",
                recommendationStyles[recommendation.recommendation]
              ].join(" ")}
            >
              {recommendation.recommendation}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Status: {recommendation.currentStatus ?? "Unknown"}
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">{recommendation.reason}</p>
        </div>

        <div className="flex items-center justify-between gap-4 md:justify-end">
          <span className={["rounded-full border px-3 py-1 text-xs font-semibold", levelStyles[optimization.risk.level]].join(" ")}>
            Risk: {optimization.risk.level}
          </span>
          <ChevronDown className="text-slate-400 transition group-open:rotate-180" size={20} aria-hidden="true" />
        </div>
      </summary>

      <div className="border-t border-slate-100 px-5 pb-5 pt-1">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-950">Impact</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {impactLabels.map(([label, key]) => (
                <div key={key}>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>{label}</span>
                    <span>{optimization.impact[key]}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${optimization.impact[key]}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated Benefit</p>
              <span className={["mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold", levelStyles[optimization.impact.estimatedBenefit ?? "Low"]].join(" ")}>
                {optimization.impact.estimatedBenefit ?? "Low"}
              </span>
            </div>
            <Link
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              state={{ recommendationResults: [recommendation] }}
              to={`/decision?id=${optimization.id}&from=report`}
            >
              View Details
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </details>
  );
}
