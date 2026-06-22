import type { OptimizationKnowledge } from "../KnowledgeDefinition";
import { scanAvailabilityFor } from "../knowledgeSchemaHelpers";

export const deliveryOptimizationKnowledge: OptimizationKnowledge = {
  identity: {
    id: "delivery-optimization",
    title: "Delivery Optimization",
    category: "Network",
    priority: "Medium",
    tags: ["network", "updates", "bandwidth", "peer sharing"],
    difficulty: "Easy",
    icon: "network"
  },
  overview: {
    summary: "Explains how Windows shares update downloads across PCs and networks.",
    purpose:
      "Help you decide whether Delivery Optimization peer sharing fits your network, bandwidth, and privacy expectations.",
    howWindowsWorks:
      "Delivery Optimization manages how Windows downloads update files and whether it can share them with other PCs.",
    whyItExists:
      "Microsoft added Delivery Optimization so Windows Update can reuse downloaded content across devices on a network."
  },
  currentStatus: {
    supportedWindows: "Windows 10, Windows 11",
    defaultValue: "Unknown",
    currentState: "Unknown",
    scanAvailability: scanAvailabilityFor("delivery-optimization")
  },
  recommendation: {
    recommendedFor: ["Homes with multiple Windows PCs", "Fast unmetered networks", "Users who understand peer-assisted updates"],
    notRecommendedFor: ["Metered connections", "Slow upload connections", "Single-PC setups"],
    typicalScenarios: [
      "You have several Windows PCs on one network and want to reduce repeated update downloads.",
      "You use a metered or slow-upload connection and want to limit sharing.",
      "You use a single PC and do not benefit from peer-assisted update delivery."
    ]
  },
  benefits: {
    performanceImpact: "Low",
    memoryImpact: "None",
    batteryImpact: "Low",
    latencyImpact: "Low",
    networkImpact: "Medium",
    privacyImpact: "Medium"
  },
  tradeOffs: {
    pros: ["Can reduce repeated update downloads", "Useful for multiple Windows PCs on one network", "May make updates more efficient"],
    cons: ["May use upload bandwidth", "Can be confusing on metered networks", "Less useful for single-PC households"],
    possibleSideEffects: [
      "May use upload bandwidth",
      "Can be undesirable on metered networks",
      "Benefits depend heavily on network context"
    ]
  },
  risks: {
    riskLevel: "Medium",
    riskExplanation:
      "The setting is reversible, but it can affect how Windows Update uses network bandwidth and may change behavior over time.",
    whenNotToUse: ["Metered connections", "Slow upload connections", "Single-PC setups"]
  },
  recovery: {
    recoveryMethod: "Restore the previous Delivery Optimization sharing option in Windows Update settings.",
    recoveryDifficulty: "Easy",
    estimatedTime: "About 1 minute",
    expectedResult: "Windows Update returns to the previous download and sharing behavior."
  },
  decisionSupport: {
    expectedBenefit: "Low",
    confidence: "Medium",
    decisionNotes:
      "This is mainly worth reviewing if bandwidth, metered connections, or multiple Windows PCs matter to you."
  },
  terminology: {
    original: "Delivery Optimization",
    localized: "Delivery Optimization（传递优化）",
    tweakmind: "Delivery Optimization\n📦 Windows 更新搬运员"
  },
  learning: {
    relatedOptimizations: ["windows-update-active-hours"],
    commonMisconceptions: [
      "Delivery Optimization disables Windows Update.",
      "Delivery Optimization always saves bandwidth on every PC."
    ],
    references: []
  }
};
