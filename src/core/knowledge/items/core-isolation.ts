import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const coreIsolationKnowledge: OptimizationKnowledge = {
  id: "core-isolation",
  title: "Core Isolation",
  category: "Security",
  summary: "Explains the security and compatibility trade-offs of Memory Integrity.",
  whatItDoes:
    "Core Isolation and Memory Integrity use virtualization-based protection to isolate sensitive parts of Windows.",
  whyItMatters:
    "This can improve protection against low-level attacks, but may affect older drivers or specific workloads.",
  why:
    "Core Isolation uses virtualization-based security features to help protect important Windows processes. TweakMind currently keeps this as a knowledge-backed recommendation until a real implementation exists.",
  benefits: ["Stronger protection for sensitive system processes", "Better defense against some driver-level attacks", "Keeps Windows security posture intact"],
  risks: ["Turning it off can reduce system protection", "Turning it on may reveal incompatible drivers", "A restart may be required"],
  tradeOffs: ["May have a small performance cost", "Can conflict with some older drivers", "Requires compatible hardware and firmware"],
  recommendedFor: ["Most daily-use PCs", "Work laptops", "Users who value security defaults"],
  notRecommendedFor: ["Users diagnosing a known driver conflict", "Specialized test machines", "Legacy hardware setups"],
  risk: {
    level: "High"
  },
  riskAnalysis:
    "This setting affects Windows security isolation and may require a restart. Changing it can reduce protection or expose driver compatibility problems.",
  recoveryMethod: "Use Windows Security to restore Memory Integrity, then restart if Windows requests it.",
  expectedBenefit: "Low",
  userDecisionNotes:
    "Security defaults should usually be kept unless you are solving a specific compatibility issue.",
  terminology: {
    original: "Core Isolation / Memory Integrity",
    localized: "Core Isolation / Memory Integrity（核心隔离 / 内存完整性）",
    tweakmind: "Core Isolation\n🛡️ 系统内核护盾"
  },
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
