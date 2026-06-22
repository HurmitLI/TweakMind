import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const powerPlanKnowledge: OptimizationKnowledge = {
  id: "power-plan",
  title: "Power Plan",
  category: "Performance",
  summary: "Explains the balance between responsiveness, heat, noise, and battery life.",
  whatItDoes:
    "Windows power modes influence how aggressively the system saves energy or keeps hardware ready for performance.",
  whyItMatters:
    "A more performance-focused mode can improve responsiveness in some workloads, while a balanced mode may reduce heat, fan noise, and battery drain.",
  why:
    "Power Plan decisions are about trade-offs. TweakMind presents them as a choice between steady performance, power use, temperature, and noise rather than a one-way upgrade.",
  benefits: ["Can improve responsiveness under load", "May reduce power saving delays", "Useful when plugged in for demanding work"],
  risks: ["Can increase heat or fan noise", "May reduce battery life", "May be unnecessary for light daily use"],
  tradeOffs: ["More energy use", "Potentially warmer hardware", "Less battery-friendly behavior"],
  recommendedFor: ["Plugged-in desktops", "Workstations under sustained load", "Users prioritizing responsiveness over battery life"],
  notRecommendedFor: ["Battery-first laptop use", "Quiet environments", "Light browsing and office workflows"],
  risk: { level: "Low" },
  riskAnalysis:
    "Power mode changes are usually easy to reverse, but they can affect comfort, temperature, and battery expectations.",
  recoveryMethod: "Return Windows power mode or power plan to the previous setting.",
  expectedBenefit: "Medium",
  userDecisionNotes:
    "Choose based on whether the PC is plugged in, thermally comfortable, and actually performance-limited.",
  terminology: {
    original: "Power Plan",
    localized: "Power Plan（电源计划）",
    tweakmind: "Power Plan\n⚡ 能量分配器"
  },
  recovery: {
    method: "Restore the previous power mode or plan from Windows Settings or Control Panel.",
    estimatedTime: "Less than 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows returns to the prior balance of performance and power saving."
  },
  impact: { performance: 50, privacy: 0, gaming: 35, battery: 70 },
  icon: "battery"
};
