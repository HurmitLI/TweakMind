import type { OptimizationRecommendation } from "../../types/optimization";

interface RecommendationBadgeProps {
  value: OptimizationRecommendation;
}

const recommendationStyles: Record<OptimizationRecommendation, string> = {
  Recommended: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Keep Default": "border-slate-200 bg-slate-100 text-slate-700",
  "Keep Enabled": "border-blue-200 bg-blue-50 text-blue-700",
  "Already Optimized": "border-emerald-200 bg-emerald-50 text-emerald-700",
  Optional: "border-amber-200 bg-amber-50 text-amber-700"
};

export function RecommendationBadge({ value }: RecommendationBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold",
        recommendationStyles[value]
      ].join(" ")}
    >
      {value}
    </span>
  );
}
