import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const coreIsolationKnowledge: OptimizationKnowledge = {
  id: "core-isolation",
  title: "Core Isolation",
  category: "Security",
  why:
    "Core Isolation uses virtualization-based security features to help protect important Windows processes. TweakMind currently keeps this as a knowledge-backed recommendation until a real implementation exists.",
  benefits: ["Stronger protection for sensitive system processes", "Better defense against some driver-level attacks", "Keeps Windows security posture intact"],
  tradeOffs: ["May have a small performance cost", "Can conflict with some older drivers", "Requires compatible hardware and firmware"],
  recommendedFor: ["Most daily-use PCs", "Work laptops", "Users who value security defaults"],
  notRecommendedFor: ["Users diagnosing a known driver conflict", "Specialized test machines", "Legacy hardware setups"],
  risk: {
    level: "High"
  },
  riskAnalysis:
    "This setting affects Windows security isolation and may require a restart. Changing it can reduce protection or expose driver compatibility problems.",
  recovery: {
    method: "Open Windows Security and restore Memory Integrity or Core Isolation settings, then restart if prompted.",
    estimatedTime: "About 5 minutes plus restart time",
    difficulty: "Medium",
    expectedResult: "Windows restores the previous security posture after restart, assuming compatible drivers are available."
  },
  impact: {
    performance: 20,
    privacy: 30,
    gaming: 20,
    battery: 10
  },
  icon: "shield"
};
