import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const deliveryOptimizationKnowledge: OptimizationKnowledge = {
  id: "delivery-optimization",
  title: "Delivery Optimization",
  category: "Network",
  why:
    "Delivery Optimization can download and share Windows update files with other PCs. TweakMind treats it as optional until the network context is known.",
  benefits: ["Can reduce repeated update downloads", "Useful for multiple Windows PCs on one network", "May make updates more efficient"],
  tradeOffs: ["May use upload bandwidth", "Can be confusing on metered networks", "Less useful for single-PC households"],
  recommendedFor: ["Homes with multiple Windows PCs", "Fast unmetered networks", "Users who understand peer-assisted updates"],
  notRecommendedFor: ["Metered connections", "Slow upload connections", "Single-PC setups"],
  risk: {
    level: "Medium"
  },
  riskAnalysis:
    "The setting is reversible, but it can affect how Windows Update uses network bandwidth and may change behavior over time.",
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
