import type { OptimizationDefinition, OptimizationId, OptimizationStatus } from "../../types/optimization";
import { createEngineResult } from "../engine/OptimizationEngine";
import type { OptimizationEngineResult } from "../engine/OptimizationEngine";
import { detectWithNativeCommand } from "../engine/NativeDetection";
import { KnowledgeRepository, knowledgeToOptimizationDefinition } from "../knowledge/KnowledgeRepository";
import { ScanCapabilityRegistry } from "../scan/ScanCapabilityRegistry";
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

function createCapabilityAwareDetector(id: OptimizationId, label: string) {
  const capability = ScanCapabilityRegistry.get(id);

  if (capability.scanCapability === "Not Supported Yet") {
    return {
      detect(): Promise<OptimizationEngineResult> {
        return Promise.resolve(
          createEngineResult({
            status: "Failed",
            success: false,
            previousState: "Unknown",
            currentState: "Unknown",
            message: capability.unavailableReason ?? `${label} scan is not supported yet.`
          })
        );
      }
    };
  }

  if (capability.nativeCommand) {
    return createNativeDetector(capability.nativeCommand, label);
  }

  return createUnavailableDetector(label);
}

function createServiceEvaluator(context: OptimizationEvaluationContext): OptimizationEvaluation {
  const status = normalizeOptimizationStatus(context.detectedStatus);

  if (status === "Disabled") {
    return createEvaluation(context, "Already Optimized", status);
  }

  if (status === "Enabled" || status === "Running" || status === "Stopped") {
    return createEvaluation(context, "Recommended", status);
  }

  return createEvaluation(context, "Optional", "Unknown");
}

function createOptionalEvaluator(context: OptimizationEvaluationContext): OptimizationEvaluation {
  return createEvaluation(context, "Optional", normalizeOptimizationStatus(context.detectedStatus));
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
    detector: createCapabilityAwareDetector("windows-search", definitions["windows-search"].title),
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
    detector: createCapabilityAwareDetector("game-mode", definitions["game-mode"].title),
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
    detector: createCapabilityAwareDetector("core-isolation", definitions["core-isolation"].title),
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
    detector: createCapabilityAwareDetector("delivery-optimization", definitions["delivery-optimization"].title),
    evaluator: {
      evaluate(context) {
        return createOptionalEvaluator(context);
      }
    },
    executor: createMockExecutor(definitions["delivery-optimization"], "Unknown", "Unknown"),
    recovery: createMockRecovery(definitions["delivery-optimization"], "Unknown")
  },
  {
    definition: definitions.sysmain,
    detector: createCapabilityAwareDetector("sysmain", definitions.sysmain.title),
    evaluator: {
      evaluate(context) {
        return createServiceEvaluator(context);
      }
    },
    executor: createMockExecutor(definitions.sysmain, "Unknown", "Unknown"),
    recovery: createMockRecovery(definitions.sysmain, "Unknown")
  },
  {
    definition: definitions.hags,
    detector: createCapabilityAwareDetector("hags", definitions.hags.title),
    evaluator: {
      evaluate(context) {
        const status = normalizeOptimizationStatus(context.detectedStatus);

        if (status === "Enabled") {
          return createEvaluation(context, "Keep Enabled", status);
        }

        if (status === "Disabled") {
          return createEvaluation(context, "Recommended", status);
        }

        return createOptionalEvaluator(context);
      }
    },
    executor: createMockExecutor(definitions.hags, "Unknown", "Unknown"),
    recovery: createMockRecovery(definitions.hags, "Unknown")
  },
  {
    definition: definitions["background-apps"],
    detector: createCapabilityAwareDetector("background-apps", definitions["background-apps"].title),
    evaluator: {
      evaluate(context) {
        return createOptionalEvaluator(context);
      }
    },
    executor: createMockExecutor(definitions["background-apps"], "Unknown", "Unknown"),
    recovery: createMockRecovery(definitions["background-apps"], "Unknown")
  },
  {
    definition: definitions["startup-apps"],
    detector: createCapabilityAwareDetector("startup-apps", definitions["startup-apps"].title),
    evaluator: {
      evaluate(context) {
        return createOptionalEvaluator(context);
      }
    },
    executor: createMockExecutor(definitions["startup-apps"], "Unknown", "Unknown"),
    recovery: createMockRecovery(definitions["startup-apps"], "Unknown")
  },
  {
    definition: definitions["power-plan"],
    detector: createCapabilityAwareDetector("power-plan", definitions["power-plan"].title),
    evaluator: {
      evaluate(context) {
        return createOptionalEvaluator(context);
      }
    },
    executor: createMockExecutor(definitions["power-plan"], "Unknown", "Unknown"),
    recovery: createMockRecovery(definitions["power-plan"], "Unknown")
  },
  {
    definition: definitions["windows-update-active-hours"],
    detector: createCapabilityAwareDetector(
      "windows-update-active-hours",
      definitions["windows-update-active-hours"].title
    ),
    evaluator: {
      evaluate(context) {
        return createOptionalEvaluator(context);
      }
    },
    executor: createMockExecutor(definitions["windows-update-active-hours"], "Unknown", "Unknown"),
    recovery: createMockRecovery(definitions["windows-update-active-hours"], "Unknown")
  },
  {
    definition: definitions["visual-effects"],
    detector: createCapabilityAwareDetector("visual-effects", definitions["visual-effects"].title),
    evaluator: {
      evaluate(context) {
        return createOptionalEvaluator(context);
      }
    },
    executor: createMockExecutor(definitions["visual-effects"], "Unknown", "Unknown"),
    recovery: createMockRecovery(definitions["visual-effects"], "Unknown")
  }
];
