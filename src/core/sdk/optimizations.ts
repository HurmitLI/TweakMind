import type { OptimizationDefinition, OptimizationId, OptimizationStatus } from "../../types/optimization";
import { createEngineResult } from "../engine/OptimizationEngine";
import type { OptimizationEngineResult } from "../engine/OptimizationEngine";
import { detectWithNativeCommand } from "../engine/NativeDetection";
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

const definitions: Record<OptimizationId, OptimizationDefinition> = {
  "windows-search": {
    id: "windows-search",
    title: "Windows Search",
    category: "Performance",
    risk: {
      level: "Low",
      reason:
        "The change is easy to reverse and does not remove files or disable security features. The main downside is slower search behavior."
    },
    recommendation: "Recommended",
    status: "Unknown",
    description:
      "Windows Search maintains an index of files, emails, and selected system locations so results appear quickly. TweakMind evaluates whether that background indexing is worth the resource cost on this PC.",
    benefits: ["Reduced background disk activity", "Slightly lower CPU usage", "Reduced indexing activity"],
    tradeOffs: ["Slower file searching", "Outlook search may become slower", "New files may take longer to appear in search results"],
    recommendedFor: ["Gaming PCs", "Rarely searches files", "Minimal Windows installations"],
    notRecommendedFor: ["Office users", "Outlook users", "Frequent file searching"],
    recovery: "Restore the previous Windows Search service startup configuration from History.",
    estimatedTime: "About 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows returns to normal search behavior after the index has time to rebuild.",
    impact: {
      performance: 75,
      privacy: 10,
      gaming: 55,
      battery: 45,
      estimatedBenefit: "High"
    },
    icon: "search"
  },
  "game-mode": {
    id: "game-mode",
    title: "Game Mode",
    category: "Gaming",
    risk: {
      level: "Low",
      reason:
        "Game Mode is a normal per-user Windows setting and can be changed back without affecting files, apps, or security settings."
    },
    recommendation: "Keep Enabled",
    status: "Unknown",
    description:
      "Game Mode helps Windows reduce background interruptions while a game is running. TweakMind checks the real setting before deciding whether enabling it is worthwhile.",
    benefits: ["May reduce background interruptions", "Can improve frame consistency in some games", "Requires no advanced configuration"],
    tradeOffs: ["Some systems may see no measurable improvement", "A few overlays or older games may behave differently"],
    recommendedFor: ["Gaming PCs", "Users who play full-screen games", "Users who want fewer interruptions while gaming"],
    notRecommendedFor: ["Users troubleshooting game compatibility", "Non-gaming workstations", "Managed enterprise devices"],
    recovery: "Restore the previous Game Mode registry state from History.",
    estimatedTime: "Less than 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows uses the previous gaming behavior the next time a game starts.",
    impact: {
      performance: 45,
      privacy: 0,
      gaming: 85,
      battery: 15,
      estimatedBenefit: "Medium"
    },
    icon: "gamepad"
  },
  "core-isolation": {
    id: "core-isolation",
    title: "Core Isolation",
    category: "Security",
    risk: {
      level: "High",
      reason:
        "This setting affects Windows security isolation and may require a restart. Changing it can reduce protection or expose driver compatibility problems."
    },
    recommendation: "Keep Default",
    status: "Unknown",
    description:
      "Core Isolation uses virtualization-based security features to help protect important Windows processes. TweakMind currently keeps this as a knowledge-backed recommendation until a real implementation exists.",
    benefits: ["Stronger protection for sensitive system processes", "Better defense against some driver-level attacks", "Keeps Windows security posture intact"],
    tradeOffs: ["May have a small performance cost", "Can conflict with some older drivers", "Requires compatible hardware and firmware"],
    recommendedFor: ["Most daily-use PCs", "Work laptops", "Users who value security defaults"],
    notRecommendedFor: ["Users diagnosing a known driver conflict", "Specialized test machines", "Legacy hardware setups"],
    recovery: "Open Windows Security and restore Memory Integrity or Core Isolation settings, then restart if prompted.",
    estimatedTime: "About 5 minutes plus restart time",
    difficulty: "Medium",
    expectedResult: "Windows restores the previous security posture after restart, assuming compatible drivers are available.",
    impact: {
      performance: 20,
      privacy: 30,
      gaming: 20,
      battery: 10,
      estimatedBenefit: "Low"
    },
    icon: "shield"
  },
  "delivery-optimization": {
    id: "delivery-optimization",
    title: "Delivery Optimization",
    category: "Network",
    risk: {
      level: "Medium",
      reason:
        "The setting is reversible, but it can affect how Windows Update uses network bandwidth and may change behavior over time."
    },
    recommendation: "Optional",
    status: "Unknown",
    description:
      "Delivery Optimization can download and share Windows update files with other PCs. TweakMind treats it as optional until the network context is known.",
    benefits: ["Can reduce repeated update downloads", "Useful for multiple Windows PCs on one network", "May make updates more efficient"],
    tradeOffs: ["May use upload bandwidth", "Can be confusing on metered networks", "Less useful for single-PC households"],
    recommendedFor: ["Homes with multiple Windows PCs", "Fast unmetered networks", "Users who understand peer-assisted updates"],
    notRecommendedFor: ["Metered connections", "Slow upload connections", "Single-PC setups"],
    recovery: "Open Windows Update Delivery Optimization settings and restore the previous sharing option.",
    estimatedTime: "About 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows Update returns to the previous download and sharing behavior.",
    impact: {
      performance: 20,
      privacy: 35,
      gaming: 10,
      battery: 25,
      estimatedBenefit: "Medium"
    },
    icon: "network"
  }
};

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
  }
];
