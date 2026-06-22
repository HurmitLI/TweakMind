import type {
  OptimizationBenefitLevel,
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
  summary: string;
  whatItDoes: string;
  whyItMatters: string;
  why: string;
  benefits: string[];
  risks: string[];
  tradeOffs: string[];
  recommendedFor: string[];
  notRecommendedFor: string[];
  risk: RiskKnowledge;
  riskAnalysis: string;
  recoveryMethod: string;
  expectedBenefit: OptimizationBenefitLevel;
  userDecisionNotes: string;
  terminology: {
    original: string;
    localized: string;
    tweakmind: string;
  };
  recovery: RecoveryKnowledge;
  impact: Omit<OptimizationImpact, "estimatedBenefit">;
  icon: string;
}
