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

function createUnavailableDetector(label: string) {
  return {
    detect(): Promise<OptimizationEngineResult> {
      return Promise.resolve(
        createEngineResult({
          status: "Failed",
          success: false,
          previousState: "Unknown",
          currentState: "Unknown",
          message: `${label} detection is not available yet.`
        })
      );
    }
  };
}

function createMockExecutor(definition: OptimizationDefinition, previousState: OptimizationStatus, currentState: OptimizationStatus) {
  return {
    apply(): Promise<OptimizationEngineResult> {
      return Promise.resolve(
        createEngineResult({
          status: "Success",
          previousState,
          currentState,
          message:
            definition.id === "windows-search"
              ? `${definition.title} is already optimized. No Windows changes were made.`
              : `${definition.title} mock apply recorded. No Windows changes were made.`
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
  KnowledgeRepository.getAll().map((knowledge) => [knowledge.identity.id, knowledgeToOptimizationDefinition(knowledge)])
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
    executor: createMockExecutor(definitions["windows-search"], "Disabled", "Disabled"),
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
    executor: createMockExecutor(definitions["game-mode"], "Unknown", "Unknown"),
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
    executor: createMockExecutor(definitions["core-isolation"], "Enabled", "Enabled"),
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
    executor: createMockExecutor(definitions["delivery-optimization"], "Unknown", "Unknown"),
    recovery: createMockRecovery(definitions["delivery-optimization"], "Unknown")
  },
  ...([
    "sysmain",
    "hags",
    "background-apps",
    "startup-apps",
    "power-plan",
    "windows-update-active-hours",
    "visual-effects"
  ] as const).map((id): OptimizationSdkModule => ({
    definition: definitions[id],
    detector: createUnavailableDetector(definitions[id].title),
    evaluator: {
      evaluate(context) {
        return createEvaluation(context, "Optional", "Unknown");
      }
    },
    executor: createMockExecutor(definitions[id], "Unknown", "Unknown"),
    recovery: createMockRecovery(definitions[id], "Unknown")
  }))
];
