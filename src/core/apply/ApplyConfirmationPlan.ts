import { KnowledgeRepository, knowledgeToOptimizationDefinition } from "../knowledge/KnowledgeRepository";
import { OptimizationRepository } from "../optimization/OptimizationRepository";
import { readStoredScanResult, toRecommendationResult } from "../scan/ScanResult";
import type { OptimizationApplyResult } from "../windows/WindowsOptimizationService";
import type { OptimizationId, OptimizationRecommendation, OptimizationStatus } from "../../types/optimization";

function targetStateFor(id: OptimizationId, recommendation: OptimizationRecommendation, currentStatus: OptimizationStatus) {
  if (recommendation === "Already Optimized" || recommendation === "Keep Default" || recommendation === "Keep Enabled") {
    return currentStatus;
  }

  const targetStates: Record<OptimizationId, OptimizationStatus> = {
    "windows-search": "Disabled",
    "game-mode": "Enabled",
    "core-isolation": "Enabled",
    "delivery-optimization": "Default"
  };

  return targetStates[id];
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

  return {
    optimization,
    knowledge,
    recommendation,
    currentStatus,
    targetState: targetStateFor(optimization.id, recommendation.recommendation, currentStatus),
    whatWillChange:
      recommendation.recommendation === "Already Optimized"
        ? "This optimization is already in the recommended state. The current MVP will only record a mock apply result."
        : "The current MVP will not modify Windows. It will only continue to the mock apply flow after confirmation.",
    readinessMessage: "Apply is not connected to real Windows changes in this PRODUCT milestone."
  };
}

export function createMockApplyResult(optimizationId: OptimizationId, previousState: OptimizationStatus): OptimizationApplyResult {
  return {
    optimizationId,
    applyMode: "mock",
    status: "success",
    previousState,
    error: null,
    timestamp: Math.floor(Date.now() / 1000).toString()
  };
}
