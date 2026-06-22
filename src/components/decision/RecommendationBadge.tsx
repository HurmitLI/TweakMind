import type { OptimizationRecommendation } from "../../types/optimization";
import { translateRecommendation } from "../../core/localization/localizationHelpers";

interface RecommendationBadgeProps {
  value: OptimizationRecommendation;
}

const recommendationStyles: Record<OptimizationRecommendation, string> = {
  Recommended: "tm-status-badge tm-status-badge-success",
  "Keep Default": "tm-status-badge",
  "Keep Enabled": "tm-status-badge",
  "Already Optimized": "tm-status-badge tm-status-badge-success",
  Optional: "tm-status-badge tm-status-badge-warning"
};

export function RecommendationBadge({ value }: RecommendationBadgeProps) {
  return <span className={recommendationStyles[value]}>{translateRecommendation(value)}</span>;
}
