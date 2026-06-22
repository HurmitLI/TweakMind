import type { OptimizationDefinition, OptimizationId } from "../../types/optimization";
import type { OptimizationBenefitLevel } from "../../types/optimization";
import type { OptimizationKnowledge } from "./KnowledgeDefinition";
import { impactLevelToScore } from "./KnowledgeDefinition";
import { backgroundAppsKnowledge } from "./items/background-apps";
import { coreIsolationKnowledge } from "./items/core-isolation";
import { deliveryOptimizationKnowledge } from "./items/delivery-optimization";
import { gameModeKnowledge } from "./items/game-mode";
import { hagsKnowledge } from "./items/hags";
import { powerPlanKnowledge } from "./items/power-plan";
import { startupAppsKnowledge } from "./items/startup-apps";
import { sysMainKnowledge } from "./items/sysmain";
import { visualEffectsKnowledge } from "./items/visual-effects";
import { windowsSearchKnowledge } from "./items/windows-search";
import { windowsUpdateActiveHoursKnowledge } from "./items/windows-update-active-hours";

const knowledgeItems: OptimizationKnowledge[] = [
  windowsSearchKnowledge,
  gameModeKnowledge,
  coreIsolationKnowledge,
  deliveryOptimizationKnowledge,
  sysMainKnowledge,
  hagsKnowledge,
  backgroundAppsKnowledge,
  startupAppsKnowledge,
  powerPlanKnowledge,
  windowsUpdateActiveHoursKnowledge,
  visualEffectsKnowledge
];

function normalizeRiskLevel(level: OptimizationKnowledge["risks"]["riskLevel"]) {
  if (level === "Unknown") {
    return "Low" as const;
  }

  return level;
}

function normalizeExpectedBenefit(
  benefit: OptimizationKnowledge["decisionSupport"]["expectedBenefit"]
): OptimizationBenefitLevel {
  if (benefit === "Unknown") {
    return "Low";
  }

  return benefit;
}

function normalizeRecoveryDifficulty(
  difficulty: OptimizationKnowledge["recovery"]["recoveryDifficulty"]
): string {
  if (difficulty === "Unknown") {
    return "Unknown";
  }

  return difficulty;
}

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
  const performanceScore = impactLevelToScore(knowledge.benefits.performanceImpact);

  return {
    id: knowledge.identity.id,
    title: knowledge.identity.title,
    category: knowledge.identity.category,
    risk: {
      level: normalizeRiskLevel(knowledge.risks.riskLevel),
      reason:
        knowledge.risks.riskLevel === "Unknown"
          ? `${knowledge.risks.riskExplanation} Risk level: Unknown.`
          : knowledge.risks.riskExplanation
    },
    recommendation: "Optional",
    status: "Unknown",
    description: knowledge.overview.purpose,
    benefits: knowledge.tradeOffs.pros,
    tradeOffs: [...knowledge.tradeOffs.cons, ...knowledge.tradeOffs.possibleSideEffects],
    recommendedFor: knowledge.recommendation.recommendedFor,
    notRecommendedFor: knowledge.recommendation.notRecommendedFor,
    recovery: knowledge.recovery.recoveryMethod,
    estimatedTime:
      knowledge.recovery.estimatedTime === "Unknown" ? "Unknown" : knowledge.recovery.estimatedTime,
    difficulty: normalizeRecoveryDifficulty(knowledge.recovery.recoveryDifficulty),
    expectedResult:
      knowledge.recovery.expectedResult === "Unknown" ? "Unknown" : knowledge.recovery.expectedResult,
    impact: {
      performance: performanceScore,
      privacy: impactLevelToScore(knowledge.benefits.privacyImpact),
      gaming: impactLevelToScore(knowledge.benefits.latencyImpact),
      battery: impactLevelToScore(knowledge.benefits.batteryImpact),
      estimatedBenefit: normalizeExpectedBenefit(knowledge.decisionSupport.expectedBenefit)
    },
    icon: knowledge.identity.icon
  };
}

export class KnowledgeRepository {
  static getAll(): OptimizationKnowledge[] {
    return knowledgeItems;
  }

  static getById(id: OptimizationId): OptimizationKnowledge | undefined {
    return knowledgeItems.find((knowledge) => knowledge.identity.id === id);
  }
}
