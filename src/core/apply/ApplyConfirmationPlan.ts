import { KnowledgeRepository, knowledgeToOptimizationDefinition } from "../knowledge/KnowledgeRepository";
import { OptimizationRepository } from "../optimization/OptimizationRepository";
import { readStoredScanResult, toRecommendationResult } from "../scan/ScanResult";
import { OptimizationCapabilityRegistry } from "../execution/OptimizationCapabilityRegistry";
import { LocalizationService } from "../localization/LocalizationService";
import type { OptimizationApplyResult } from "../windows/WindowsOptimizationService";
import type { OptimizationId, OptimizationRecommendation, OptimizationStatus } from "../../types/optimization";

export function getTargetStateForOptimization(
  id: OptimizationId,
  recommendation: OptimizationRecommendation,
  currentStatus: OptimizationStatus
) {
  if (recommendation === "Already Optimized" || recommendation === "Keep Default" || recommendation === "Keep Enabled") {
    return currentStatus;
  }

  const targetStates: Partial<Record<OptimizationId, OptimizationStatus>> = {
    "windows-search": "Disabled",
    "game-mode": "Enabled",
    "core-isolation": "Enabled",
    "delivery-optimization": "Disabled",
    sysmain: "Disabled",
    hags: "Enabled",
    "power-plan": "Enabled"
  };

  return targetStates[id] ?? "Unknown";
}

export function getApplyConfirmationPlan(id: OptimizationId) {
  const scanResult = readStoredScanResult();
  const defaultOptimization = OptimizationRepository.getDefault();
  const optimizationResult = scanResult?.optimizationResults.find((result) => result.id === id);
  const knowledge = KnowledgeRepository.getById(id);
  const optimization =
    (knowledge ? knowledgeToOptimizationDefinition(knowledge) : undefined) ??
    optimizationResult?.definition ??
    OptimizationRepository.getById(id) ??
    defaultOptimization;
  const recommendation = optimizationResult
    ? toRecommendationResult(optimizationResult)
    : {
        id: optimization.id,
        recommendation: optimization.recommendation,
        reason: optimization.description,
        currentStatus: "Unknown" as const,
        selectable: false,
        selectedByDefault: false
      };
  const currentStatus = recommendation.currentStatus ?? "Unknown";
  const capabilities = OptimizationCapabilityRegistry.get(optimization.id);
  const isAlreadyOptimized = recommendation.recommendation === "Already Optimized";
  const safetyNoticeKeys: Partial<Record<OptimizationId, "applyPlan.safetyNotice.sysmain" | "applyPlan.safetyNotice.hags" | "applyPlan.safetyNotice.powerPlan">> = {
    sysmain: "applyPlan.safetyNotice.sysmain",
    hags: "applyPlan.safetyNotice.hags",
    "power-plan": "applyPlan.safetyNotice.powerPlan"
  };
  const safetyNoticeKey = safetyNoticeKeys[optimization.id];

  return {
    optimization,
    knowledge,
    recommendation,
    currentStatus,
    canApply: capabilities.canRealApply,
    targetState: getTargetStateForOptimization(optimization.id, recommendation.recommendation, currentStatus),
    safetyNotice: safetyNoticeKey ? LocalizationService.translate(safetyNoticeKey) : undefined,
    whatWillChange:
      capabilities.canRealApply && !isAlreadyOptimized
        ? LocalizationService.translate("applyPlan.whatWillChange.real", { title: optimization.title })
        : capabilities.canRealApply
          ? LocalizationService.translate("applyPlan.whatWillChange.alreadyOptimized", { title: optimization.title })
          : LocalizationService.translate("applyPlan.whatWillChange.notConnected"),
    readinessMessage: capabilities.canRealApply
      ? LocalizationService.translate("applyPlan.readiness.real", { title: optimization.title })
      : LocalizationService.translate("applyPlan.readiness.notAvailable")
  };
}

export function createMockApplyResult(optimizationId: OptimizationId, previousState: OptimizationStatus): OptimizationApplyResult {
  return {
    optimizationId,
    applyMode: "mock",
    status: "success",
    previousState,
    currentState: previousState,
    error: null,
    timestamp: Math.floor(Date.now() / 1000).toString()
  };
}
