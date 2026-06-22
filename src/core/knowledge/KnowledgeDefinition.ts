import type {
  OptimizationBenefitLevel,
  OptimizationCategory,
  OptimizationId,
  OptimizationRiskLevel,
  OptimizationStatus
} from "../../types/optimization";

export type KnowledgeUnknown = "Unknown";

export type KnowledgePriority = "Low" | "Medium" | "High" | KnowledgeUnknown;

export type KnowledgeDifficulty = "Easy" | "Medium" | "Hard" | KnowledgeUnknown;

export type KnowledgeImpactLevel = "None" | "Low" | "Medium" | "High" | KnowledgeUnknown;

export type KnowledgeConfidence = "Low" | "Medium" | "High" | KnowledgeUnknown;

export type KnowledgeScanAvailability = "Available" | "Not Available" | KnowledgeUnknown;

export interface KnowledgeIdentity {
  id: OptimizationId;
  title: string;
  category: OptimizationCategory;
  priority: KnowledgePriority;
  tags: string[];
  difficulty: KnowledgeDifficulty;
  icon: string;
}

export interface KnowledgeOverview {
  summary: string;
  purpose: string;
  howWindowsWorks: string;
  whyItExists: string;
}

export interface KnowledgeCurrentStatus {
  supportedWindows: string | KnowledgeUnknown;
  defaultValue: OptimizationStatus | KnowledgeUnknown;
  currentState: OptimizationStatus | KnowledgeUnknown;
  scanAvailability: KnowledgeScanAvailability;
}

export interface KnowledgeRecommendation {
  recommendedFor: string[];
  notRecommendedFor: string[];
  typicalScenarios: string[];
}

export interface KnowledgeBenefits {
  performanceImpact: KnowledgeImpactLevel;
  memoryImpact: KnowledgeImpactLevel;
  batteryImpact: KnowledgeImpactLevel;
  latencyImpact: KnowledgeImpactLevel;
  networkImpact: KnowledgeImpactLevel;
  privacyImpact: KnowledgeImpactLevel;
}

export interface KnowledgeTradeOffs {
  pros: string[];
  cons: string[];
  possibleSideEffects: string[];
}

export interface KnowledgeRisks {
  riskLevel: OptimizationRiskLevel | KnowledgeUnknown;
  riskExplanation: string;
  whenNotToUse: string[];
}

export interface KnowledgeRecovery {
  recoveryMethod: string;
  recoveryDifficulty: KnowledgeDifficulty;
  estimatedTime: string | KnowledgeUnknown;
  expectedResult: string | KnowledgeUnknown;
}

export interface KnowledgeDecisionSupport {
  expectedBenefit: OptimizationBenefitLevel | KnowledgeUnknown;
  confidence: KnowledgeConfidence;
  decisionNotes: string;
}

export interface KnowledgeTerminology {
  original: string;
  localized: string;
  tweakmind: string;
}

export interface KnowledgeLearning {
  relatedOptimizations: OptimizationId[];
  commonMisconceptions: string[];
  references: string[];
}

export interface OptimizationKnowledge {
  identity: KnowledgeIdentity;
  overview: KnowledgeOverview;
  currentStatus: KnowledgeCurrentStatus;
  recommendation: KnowledgeRecommendation;
  benefits: KnowledgeBenefits;
  tradeOffs: KnowledgeTradeOffs;
  risks: KnowledgeRisks;
  recovery: KnowledgeRecovery;
  decisionSupport: KnowledgeDecisionSupport;
  terminology: KnowledgeTerminology;
  learning: KnowledgeLearning;
}

export function impactLevelToScore(level: KnowledgeImpactLevel): number {
  switch (level) {
    case "High":
      return 75;
    case "Medium":
      return 50;
    case "Low":
      return 25;
    case "None":
      return 0;
    default:
      return 0;
  }
}

export function impactScoreToLevel(score: number): KnowledgeImpactLevel {
  if (score >= 60) {
    return "High";
  }

  if (score >= 35) {
    return "Medium";
  }

  if (score > 0) {
    return "Low";
  }

  return "None";
}
