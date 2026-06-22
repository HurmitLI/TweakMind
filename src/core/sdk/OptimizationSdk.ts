import type {
  OptimizationDefinition,
  OptimizationId,
  OptimizationRecommendation,
  OptimizationStatus
} from "../../types/optimization";
import type { MockDeviceType } from "../recommendation/RecommendationResult";
import type { OptimizationEngineResult } from "../engine/OptimizationEngine";

export type OptimizationKnowledgeDefinition = OptimizationDefinition;

export interface OptimizationDetection {
  rawStatus: OptimizationStatus;
  normalizedStatus: OptimizationStatus;
  result: OptimizationEngineResult;
}

export interface OptimizationEvaluation {
  recommendation: OptimizationRecommendation;
  reason: string;
  selectable: boolean;
  selectedByDefault: boolean;
  currentStatus: OptimizationStatus;
}

export interface OptimizationEvaluationContext {
  definition: OptimizationKnowledgeDefinition;
  detectedStatus: OptimizationStatus;
  deviceType: MockDeviceType;
}

export interface OptimizationDetector {
  detect(): Promise<OptimizationEngineResult>;
}

export interface OptimizationEvaluator {
  evaluate(context: OptimizationEvaluationContext): OptimizationEvaluation;
}

export interface OptimizationExecutor {
  apply(): Promise<OptimizationEngineResult>;
}

export interface OptimizationRecovery {
  restore(previousState: OptimizationStatus): Promise<OptimizationEngineResult>;
}

export interface OptimizationSdkModule {
  definition: OptimizationKnowledgeDefinition;
  detector: OptimizationDetector;
  evaluator: OptimizationEvaluator;
  executor: OptimizationExecutor;
  recovery: OptimizationRecovery;
}

export interface OptimizationSdkOutput {
  definition: OptimizationKnowledgeDefinition;
  detection: OptimizationDetection;
  evaluation: OptimizationEvaluation;
}

export function normalizeOptimizationStatus(status: OptimizationStatus | undefined): OptimizationStatus {
  return status || "Unknown";
}

export function isSelectableRecommendation(recommendation: OptimizationRecommendation) {
  return recommendation === "Recommended" || recommendation === "Optional";
}

export function isSelectedByDefaultRecommendation(recommendation: OptimizationRecommendation) {
  return recommendation === "Recommended";
}
