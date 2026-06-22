import type { OptimizationDefinition, OptimizationId } from "../../types/optimization";
import type { OptimizationBenefitLevel } from "../../types/optimization";
import type { OptimizationKnowledge } from "./KnowledgeDefinition";
import { coreIsolationKnowledge } from "./items/core-isolation";
import { deliveryOptimizationKnowledge } from "./items/delivery-optimization";
import { gameModeKnowledge } from "./items/game-mode";
import { windowsSearchKnowledge } from "./items/windows-search";

const knowledgeItems: OptimizationKnowledge[] = [
  windowsSearchKnowledge,
  gameModeKnowledge,
  coreIsolationKnowledge,
  deliveryOptimizationKnowledge
];

export function estimateBenefitFromImpact(performanceImpact: number): OptimizationBenefitLevel {
  if (performanceImpact >= 60) {
    return "High";
  }

  if (performanceImpact >= 35) {
    return "Medium";
  }

  return "Low";
}

export function knowledgeToOptimizationDefinition(knowledge: OptimizationKnowledge): OptimizationDefinition {
  return {
    id: knowledge.id,
    title: knowledge.title,
    category: knowledge.category,
    risk: {
      level: knowledge.risk.level,
      reason: knowledge.riskAnalysis
    },
    recommendation: "Optional",
    status: "Unknown",
    description: knowledge.why,
    benefits: knowledge.benefits,
    tradeOffs: knowledge.tradeOffs,
    recommendedFor: knowledge.recommendedFor,
    notRecommendedFor: knowledge.notRecommendedFor,
    recovery: knowledge.recovery.method,
    estimatedTime: knowledge.recovery.estimatedTime,
    difficulty: knowledge.recovery.difficulty,
    expectedResult: knowledge.recovery.expectedResult,
    impact: {
      ...knowledge.impact,
      estimatedBenefit: estimateBenefitFromImpact(knowledge.impact.performance)
    },
    icon: knowledge.icon
  };
}

export class KnowledgeRepository {
  static getAll(): OptimizationKnowledge[] {
    return knowledgeItems;
  }

  static getById(id: OptimizationId): OptimizationKnowledge | undefined {
    return knowledgeItems.find((knowledge) => knowledge.id === id);
  }
}
