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
  const isWindowsSearch = optimization.id === "windows-search";
  const isAlreadyOptimized = recommendation.recommendation === "Already Optimized";

  return {
    optimization,
    knowledge,
    recommendation,
    currentStatus,
    targetState: targetStateFor(optimization.id, recommendation.recommendation, currentStatus),
    whatWillChange:
      isWindowsSearch && !isAlreadyOptimized
        ? "TweakMind will capture the current Windows Search service state, then ask the native executor to disable Windows Search."
        : isWindowsSearch
          ? "Windows Search is already in the recommended state. The executor will still capture the current state before reporting the result."
          : "This optimization is not connected to real Windows Apply yet. Confirmation will not modify Windows.",
    readinessMessage: isWindowsSearch
      ? "Real Apply is available for Windows Search only and runs through the Tauri executor, not UI code."
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
