import type { OptimizationKnowledge } from "../KnowledgeDefinition";
import { scanAvailabilityFor } from "../knowledgeSchemaHelpers";

export const hagsKnowledge: OptimizationKnowledge = {
  identity: {
    id: "hags",
    title: "Hardware-Accelerated GPU Scheduling",
    category: "Gaming",
    priority: "Medium",
    tags: ["gaming", "gpu", "graphics", "drivers"],
    difficulty: "Medium",
    icon: "gpu"
  },
  overview: {
    summary: "Explains the Windows graphics scheduling option often called HAGS.",
    purpose: "Help you decide whether Hardware-Accelerated GPU Scheduling is worth testing on your system.",
    howWindowsWorks:
      "HAGS lets the GPU manage parts of its own scheduling work instead of leaving all scheduling to Windows.",
    whyItExists:
      "Microsoft added HAGS to reduce scheduling overhead on supported GPUs and driver stacks."
  },
  currentStatus: {
    supportedWindows: "Windows 10, Windows 11",
    defaultValue: "Unknown",
    currentState: "Unknown",
    scanAvailability: scanAvailabilityFor("hags")
  },
  recommendation: {
    recommendedFor: ["Users testing a specific graphics issue", "Modern GPUs with current drivers", "Gaming PCs where reversibility is understood"],
    notRecommendedFor: ["Stable production workstations", "Users avoiding driver experiments", "Older GPUs or outdated drivers"],
    typicalScenarios: [
      "You are testing frame pacing or latency on a supported GPU and driver.",
      "You need a stable workstation and want to avoid graphics experiments.",
      "You run older GPUs or outdated drivers with unknown HAGS support."
    ]
  },
  benefits: {
    performanceImpact: "Low",
    memoryImpact: "Unknown",
    batteryImpact: "Low",
    latencyImpact: "Medium",
    networkImpact: "None",
    privacyImpact: "None"
  },
  tradeOffs: {
    pros: ["May improve frame pacing on some systems", "Can reduce scheduling overhead in supported configurations", "Easy to review before changing"],
    cons: ["Possible driver-specific issues", "Requires testing after change", "May have no visible effect"],
    possibleSideEffects: ["Some games or drivers may behave worse", "A restart is usually required", "Benefits are not guaranteed"]
  },
  risks: {
    riskLevel: "Medium",
    riskExplanation:
      "The setting is reversible, but graphics scheduling changes can affect stability or game behavior until changed back and restarted.",
    whenNotToUse: ["Stable production workstations", "Users avoiding driver experiments", "Older GPUs or outdated drivers"]
  },
  recovery: {
    recoveryMethod: "Restore the previous Graphics settings value and restart if Windows requests it.",
    recoveryDifficulty: "Easy",
    estimatedTime: "About 2 minutes plus restart time",
    expectedResult: "Windows returns to the previous graphics scheduling behavior."
  },
  decisionSupport: {
    expectedBenefit: "Low",
    confidence: "Low",
    decisionNotes: "Treat HAGS as something to test carefully, not as a guaranteed FPS improvement."
  },
  terminology: {
    original: "Hardware-Accelerated GPU Scheduling",
    localized: "Hardware-Accelerated GPU Scheduling（硬件加速 GPU 计划）",
    tweakmind: "HAGS\n🎛️ 显卡排班助手"
  },
  learning: {
    relatedOptimizations: ["game-mode", "visual-effects"],
    commonMisconceptions: ["HAGS always improves FPS.", "HAGS works the same on every GPU and driver version."],
    references: []
  }
};
