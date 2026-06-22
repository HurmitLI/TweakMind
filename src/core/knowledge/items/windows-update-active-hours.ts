import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const windowsUpdateActiveHoursKnowledge: OptimizationKnowledge = {
  id: "windows-update-active-hours",
  title: "Windows Update Active Hours",
  category: "Windows",
  summary: "Explains how Windows avoids restarts during the hours you normally use the PC.",
  whatItDoes:
    "Active Hours tell Windows when the PC is usually in use so update restarts are less likely during that time.",
  whyItMatters:
    "Well-set Active Hours can reduce surprise restart risk without disabling updates.",
  why:
    "Windows Update is important, but timing matters. Active Hours help make updates less disruptive while keeping the update system intact.",
  benefits: ["Can reduce unexpected restart interruptions", "Keeps Windows Update enabled", "Useful for work or gaming schedules"],
  risks: ["Poorly chosen hours may not match real usage", "Updates can still require attention later", "Does not eliminate restart requirements"],
  tradeOffs: ["Restart timing may move to off-hours", "Long active windows may delay completion", "Still requires occasional update planning"],
  recommendedFor: ["Users with predictable work hours", "Gaming sessions at regular times", "Shared PCs with known usage windows"],
  notRecommendedFor: ["Users with unpredictable schedules", "Devices that must update immediately", "Managed enterprise update policies"],
  risk: { level: "Low" },
  riskAnalysis:
    "Active Hours is low risk because it changes restart timing, not whether Windows receives security updates.",
  recoveryMethod: "Restore automatic Active Hours or set the previous time window.",
  expectedBenefit: "Low",
  userDecisionNotes:
    "This is about reducing disruption, not increasing raw performance.",
  terminology: {
    original: "Windows Update Active Hours",
    localized: "Windows Update Active Hours（Windows 更新活动时间）",
    tweakmind: "Active Hours\n🕒 更新免打扰时间"
  },
  recovery: {
    method: "Return Active Hours to automatic mode or the previous schedule.",
    estimatedTime: "Less than 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows Update returns to the previous restart timing behavior."
  },
  impact: { performance: 5, privacy: 0, gaming: 30, battery: 5 },
  icon: "clock"
};
