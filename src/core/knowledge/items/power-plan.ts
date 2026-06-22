import type { OptimizationKnowledge } from "../KnowledgeDefinition";
import { scanAvailabilityFor } from "../knowledgeSchemaHelpers";

export const powerPlanKnowledge: OptimizationKnowledge = {
  identity: {
    id: "power-plan",
    title: "Power Plan",
    category: "Performance",
    priority: "Medium",
    tags: ["power", "battery", "performance", "thermal"],
    difficulty: "Easy",
    icon: "battery"
  },
  overview: {
    summary: "Explains the balance between responsiveness, heat, noise, and battery life.",
    purpose: "Help you choose a power mode that matches how and where you use the PC.",
    howWindowsWorks:
      "Windows power modes influence how aggressively the system saves energy or keeps hardware ready for performance.",
    whyItExists:
      "Microsoft added power plans so users can balance performance, battery life, heat, and fan noise."
  },
  currentStatus: {
    supportedWindows: "Windows 10, Windows 11",
    defaultValue: "Default",
    currentState: "Unknown",
    scanAvailability: scanAvailabilityFor("power-plan")
  },
  recommendation: {
    recommendedFor: ["Plugged-in desktops", "Workstations under sustained load", "Users prioritizing responsiveness over battery life"],
    notRecommendedFor: ["Battery-first laptop use", "Quiet environments", "Light browsing and office workflows"],
    typicalScenarios: [
      "You use a plugged-in desktop and want maximum responsiveness under load.",
      "You rely on battery life and prefer quieter, cooler operation.",
      "You mostly browse or work in office apps and do not need aggressive performance."
    ]
  },
  benefits: {
    performanceImpact: "Medium",
    memoryImpact: "None",
    batteryImpact: "High",
    latencyImpact: "Medium",
    networkImpact: "None",
    privacyImpact: "None"
  },
  tradeOffs: {
    pros: ["Can improve responsiveness under load", "May reduce power saving delays", "Useful when plugged in for demanding work"],
    cons: ["More energy use", "Potentially warmer hardware", "Less battery-friendly behavior"],
    possibleSideEffects: ["Can increase heat or fan noise", "May reduce battery life", "May be unnecessary for light daily use"]
  },
  risks: {
    riskLevel: "Low",
    riskExplanation:
      "Power mode changes are usually easy to reverse, but they can affect comfort, temperature, and battery expectations.",
    whenNotToUse: ["Battery-first laptop use", "Quiet environments", "Light browsing and office workflows"]
  },
  recovery: {
    recoveryMethod: "Return Windows power mode or power plan to the previous setting.",
    recoveryDifficulty: "Easy",
    estimatedTime: "Less than 1 minute",
    expectedResult: "Windows returns to the prior balance of performance and power saving."
  },
  decisionSupport: {
    expectedBenefit: "Medium",
    confidence: "Medium",
    decisionNotes:
      "Choose based on whether the PC is plugged in, thermally comfortable, and actually performance-limited."
  },
  terminology: {
    original: "Power Plan",
    localized: "Power Plan（电源计划）",
    tweakmind: "Power Plan\n⚡ 能量分配器"
  },
  learning: {
    relatedOptimizations: ["background-apps", "visual-effects"],
    commonMisconceptions: [
      "High performance mode always makes every app faster.",
      "Power plan changes replace hardware upgrades."
    ],
    references: []
  }
};
