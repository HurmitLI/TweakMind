import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const deliveryOptimizationKnowledge: OptimizationKnowledge = {
  id: "delivery-optimization",
  title: "Delivery Optimization",
  category: "Network",
  summary: "Explains how Windows shares update downloads across PCs and networks.",
  whatItDoes:
    "Delivery Optimization manages how Windows downloads update files and whether it can share them with other PCs.",
  whyItMatters:
    "It can save repeated downloads on multi-PC networks, but may use upload bandwidth or feel unnecessary on one PC.",
  why:
    "Delivery Optimization can download and share Windows update files with other PCs. TweakMind treats it as optional until the network context is known.",
  benefits: ["Can reduce repeated update downloads", "Useful for multiple Windows PCs on one network", "May make updates more efficient"],
  risks: ["May use upload bandwidth", "Can be undesirable on metered networks", "Benefits depend heavily on network context"],
  tradeOffs: ["May use upload bandwidth", "Can be confusing on metered networks", "Less useful for single-PC households"],
  recommendedFor: ["Homes with multiple Windows PCs", "Fast unmetered networks", "Users who understand peer-assisted updates"],
  notRecommendedFor: ["Metered connections", "Slow upload connections", "Single-PC setups"],
  risk: {
    level: "Medium"
  },
  riskAnalysis:
    "The setting is reversible, but it can affect how Windows Update uses network bandwidth and may change behavior over time.",
  recoveryMethod: "Restore the previous Delivery Optimization sharing option in Windows Update settings.",
  expectedBenefit: "Low",
  userDecisionNotes:
    "This is mainly worth reviewing if bandwidth, metered connections, or multiple Windows PCs matter to you.",
  terminology: {
    original: "Delivery Optimization",
    localized: "Delivery Optimization（传递优化）",
    tweakmind: "Delivery Optimization\n📦 Windows 更新搬运员"
  },
  recovery: {
    method: "Open Windows Update Delivery Optimization settings and restore the previous sharing option.",
    estimatedTime: "About 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows Update returns to the previous download and sharing behavior."
  },
  impact: {
    performance: 20,
    privacy: 35,
    gaming: 10,
    battery: 25
  },
  icon: "network"
};
