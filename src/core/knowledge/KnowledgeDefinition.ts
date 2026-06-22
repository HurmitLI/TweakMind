import type {
  OptimizationCategory,
  OptimizationId,
  OptimizationImpact,
  OptimizationRiskLevel
} from "../../types/optimization";

export interface RecoveryKnowledge {
  method: string;
  estimatedTime: string;
  difficulty: string;
  expectedResult: string;
}

export interface RiskKnowledge {
  level: OptimizationRiskLevel;
}

export interface OptimizationKnowledge {
  id: OptimizationId;
  title: string;
  category: OptimizationCategory;
  why: string;
  benefits: string[];
  tradeOffs: string[];
  recommendedFor: string[];
  notRecommendedFor: string[];
  risk: RiskKnowledge;
  riskAnalysis: string;
  recovery: RecoveryKnowledge;
  impact: Omit<OptimizationImpact, "estimatedBenefit">;
  icon: string;
}
