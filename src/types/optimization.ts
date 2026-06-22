export type OptimizationId =
  | "windows-search"
  | "game-mode"
  | "core-isolation"
  | "delivery-optimization"
  | "sysmain"
  | "hags"
  | "background-apps"
  | "startup-apps"
  | "power-plan"
  | "windows-update-active-hours"
  | "visual-effects";

export type OptimizationCategory = "Performance" | "Gaming" | "Security" | "Network" | "Privacy" | "Windows";

export type OptimizationRecommendation =
  | "Recommended"
  | "Keep Default"
  | "Keep Enabled"
  | "Optional"
  | "Already Optimized";

export type OptimizationRiskLevel = "Low" | "Medium" | "High";

export type OptimizationBenefitLevel = "Low" | "Medium" | "High";

export type OptimizationStatus = "Enabled" | "Disabled" | "Running" | "Stopped" | "Default" | "Unknown";

export interface OptimizationImpact {
  performance: number;
  gaming: number;
  privacy: number;
  battery: number;
  estimatedBenefit?: OptimizationBenefitLevel;
}

export interface OptimizationRisk {
  level: OptimizationRiskLevel;
  reason: string;
}

export interface OptimizationDefinition {
  id: OptimizationId;
  title: string;
  category: OptimizationCategory;
  risk: OptimizationRisk;
  recommendation: OptimizationRecommendation;
  status: OptimizationStatus;
  description: string;
  benefits: string[];
  tradeOffs: string[];
  recommendedFor: string[];
  notRecommendedFor: string[];
  recovery: string;
  estimatedTime: string;
  difficulty: string;
  expectedResult: string;
  impact: OptimizationImpact;
  icon: string;
}
