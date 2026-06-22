import type { OptimizationDefinition, OptimizationId, OptimizationStatus } from "../../types/optimization";
import { createEngineResult } from "../engine/OptimizationEngine";
import type { OptimizationEngineResult } from "../engine/OptimizationEngine";
import { detectWithNativeCommand } from "../engine/NativeDetection";
import { KnowledgeRepository, knowledgeToOptimizationDefinition } from "../knowledge/KnowledgeRepository";
import type {
  OptimizationEvaluation,
  OptimizationEvaluationContext,
  OptimizationSdkModule
} from "./OptimizationSdk";
import {
  isSelectableRecommendation,
  isSelectedByDefaultRecommendation,
  normalizeOptimizationStatus
} from "./OptimizationSdk";

function createEvaluation(
  context: OptimizationEvaluationContext,
  recommendation: OptimizationEvaluation["recommendation"],
  currentStatus = context.detectedStatus
): OptimizationEvaluation {
  return {
    recommendation,
    reason: context.definition.description,
    selectable: isSelectableRecommendation(recommendation),
    selectedByDefault: isSelectedByDefaultRecommendation(recommendation),
    currentStatus: normalizeOptimizationStatus(currentStatus)
  };
}

function createNativeDetector(command: string, label: string) {
  return {
    detect() {
      return detectWithNativeCommand(command, label);
    }
  };
}

function createUnsupportedExecutor(definition: OptimizationDefinition) {
  return {
    apply(): Promise<OptimizationEngineResult> {
      return Promise.resolve(
        createEngineResult({
          status: "Failed",
          previousState: "Unknown",
          currentState: "Unknown",
          message: `${definition.title} does not have a frontend mock apply path. No Windows changes were made.`
        })
      );
    }
  };
}

function createMockRecovery(definition: OptimizationDefinition, previousState: OptimizationStatus) {
  return {
    restore(targetState: OptimizationStatus = previousState): Promise<OptimizationEngineResult> {
      return Promise.resolve(
        createEngineResult({
          status: "Success",
          previousState,
          currentState: targetState,
          message:
            definition.id === "windows-search"
              ? `${definition.title} restore recorded. No Windows changes were made.`
              : `${definition.title} mock restore recorded. No Windows changes were made.`
        })
      );
    }
  };
}

const definitions = Object.fromEntries(
  KnowledgeRepository.getAll().map((knowledge) => [knowledge.id, knowledgeToOptimizationDefinition(knowledge)])
) as Record<OptimizationId, OptimizationDefinition>;

export const optimizationSdkModules: OptimizationSdkModule[] = [
  {
    definition: definitions["windows-search"],
    detector: createNativeDetector("detect_windows_search", definitions["windows-search"].title),
    evaluator: {
      evaluate(context) {
        const status = normalizeOptimizationStatus(context.detectedStatus);

        if (status === "Disabled") {
          return createEvaluation(context, "Already Optimized", status);
        }

        if (status === "Enabled" || status === "Running" || status === "Stopped") {
          return createEvaluation(context, "Recommended", status);
        }

        return createEvaluation(context, "Optional", "Unknown");
      }
    },
    executor: createUnsupportedExecutor(definitions["windows-search"]),
    recovery: createMockRecovery(definitions["windows-search"], "Disabled")
  },
  {
    definition: definitions["game-mode"],
    detector: createNativeDetector("detect_game_mode", definitions["game-mode"].title),
    evaluator: {
      evaluate(context) {
        const status = normalizeOptimizationStatus(context.detectedStatus);

        if (status === "Enabled") {
          return createEvaluation(context, "Keep Enabled", status);
        }

        if (status === "Disabled") {
          return createEvaluation(context, "Recommended", status);
        }

        return createEvaluation(context, "Optional", "Unknown");
      }
    },
    executor: createUnsupportedExecutor(definitions["game-mode"]),
    recovery: createMockRecovery(definitions["game-mode"], "Unknown")
  },
  {
    definition: definitions["core-isolation"],
    detector: createNativeDetector("detect_core_isolation", definitions["core-isolation"].title),
    evaluator: {
      evaluate(context) {
        const status = normalizeOptimizationStatus(context.detectedStatus);

        if (status === "Enabled") {
          return createEvaluation(context, "Keep Default", status);
        }

        if (status === "Disabled") {
          return createEvaluation(context, "Optional", status);
        }

        return createEvaluation(context, "Optional", "Unknown");
      }
    },
    executor: createUnsupportedExecutor(definitions["core-isolation"]),
    recovery: createMockRecovery(definitions["core-isolation"], "Enabled")
  },
  {
    definition: definitions["delivery-optimization"],
    detector: createNativeDetector("detect_delivery_optimization", definitions["delivery-optimization"].title),
    evaluator: {
      evaluate(context) {
        return createEvaluation(context, "Optional", normalizeOptimizationStatus(context.detectedStatus));
      }
    },
    executor: createUnsupportedExecutor(definitions["delivery-optimization"]),
    recovery: createMockRecovery(definitions["delivery-optimization"], "Unknown")
  }
];
