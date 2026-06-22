import { KnowledgeRepository, knowledgeToOptimizationDefinition } from "../knowledge/KnowledgeRepository";
import { OptimizationRepository } from "../optimization/OptimizationRepository";
import { readStoredScanResult, toRecommendationResult } from "../scan/ScanResult";
import { OptimizationCapabilityRegistry } from "../execution/OptimizationCapabilityRegistry";
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
    sysmain: "Disabled"
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
  const safetyNotices: Partial<Record<OptimizationId, string>> = {
    sysmain:
      "Disabling SysMain may reduce app launch prefetching and change memory behavior. TweakMind does not guarantee FPS or performance gains. Review the trade-offs before applying rather than disabling blindly."
  };

  return {
    optimization,
    knowledge,
    recommendation,
    currentStatus,
    targetState: getTargetStateForOptimization(optimization.id, recommendation.recommendation, currentStatus),
    safetyNotice: safetyNotices[optimization.id],
    whatWillChange:
      capabilities.canRealApply && !isAlreadyOptimized
        ? `TweakMind will capture the current ${optimization.title} state, then ask the native executor to move it to the target state.`
        : capabilities.canRealApply
          ? `${optimization.title} is already in the recommended state. The executor will still capture the current state before reporting the result.`
          : "This optimization is not connected to real Windows Apply yet. Confirmation will not modify Windows.",
    readinessMessage: capabilities.canRealApply
      ? `Real Apply is available for ${optimization.title} and runs through the Tauri executor, not UI code.`
      : "Real Apply is not available for this optimization yet. No Windows changes will be made."
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
