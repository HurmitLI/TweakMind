import type { OptimizationKnowledge } from "../KnowledgeDefinition";
import { scanAvailabilityFor } from "../knowledgeSchemaHelpers";

export const windowsUpdateActiveHoursKnowledge: OptimizationKnowledge = {
  identity: {
    id: "windows-update-active-hours",
    title: "Windows Update Active Hours",
    category: "Windows",
    priority: "Low",
    tags: ["updates", "restart", "schedule", "maintenance"],
    difficulty: "Easy",
    icon: "clock"
  },
  overview: {
    summary: "Explains how Windows avoids restarts during the hours you normally use the PC.",
    purpose: "Help you decide whether Active Hours reduce update disruption without disabling updates.",
    howWindowsWorks:
      "Active Hours tell Windows when the PC is usually in use so update restarts are less likely during that time.",
    whyItExists:
      "Microsoft added Active Hours so Windows Update can stay enabled while reducing surprise restart interruptions."
  },
  currentStatus: {
    supportedWindows: "Windows 10, Windows 11",
    defaultValue: "Default",
    currentState: "Unknown",
    scanAvailability: scanAvailabilityFor("windows-update-active-hours")
  },
  recommendation: {
    recommendedFor: ["Users with predictable work hours", "Gaming sessions at regular times", "Shared PCs with known usage windows"],
    notRecommendedFor: ["Users with unpredictable schedules", "Devices that must update immediately", "Managed enterprise update policies"],
    typicalScenarios: [
      "You use the PC on a predictable schedule and want fewer surprise restarts.",
      "Your schedule changes often and fixed Active Hours may not match real usage.",
      "Your device is managed by an enterprise update policy."
    ]
  },
  benefits: {
    performanceImpact: "None",
    memoryImpact: "None",
    batteryImpact: "None",
    latencyImpact: "Low",
    networkImpact: "None",
    privacyImpact: "None"
  },
  tradeOffs: {
    pros: ["Can reduce unexpected restart interruptions", "Keeps Windows Update enabled", "Useful for work or gaming schedules"],
    cons: ["Restart timing may move to off-hours", "Long active windows may delay completion", "Still requires occasional update planning"],
    possibleSideEffects: [
      "Poorly chosen hours may not match real usage",
      "Updates can still require attention later",
      "Does not eliminate restart requirements"
    ]
  },
  risks: {
    riskLevel: "Low",
    riskExplanation:
      "Active Hours is low risk because it changes restart timing, not whether Windows receives security updates.",
    whenNotToUse: ["Users with unpredictable schedules", "Devices that must update immediately", "Managed enterprise update policies"]
  },
  recovery: {
    recoveryMethod: "Restore automatic Active Hours or set the previous time window.",
    recoveryDifficulty: "Easy",
    estimatedTime: "Less than 1 minute",
    expectedResult: "Windows Update returns to the previous restart timing behavior."
  },
  decisionSupport: {
    expectedBenefit: "Low",
    confidence: "Medium",
    decisionNotes: "This is about reducing disruption, not increasing raw performance."
  },
  terminology: {
    original: "Windows Update Active Hours",
    localized: "Windows Update Active Hours（Windows 更新活动时间）",
    tweakmind: "Active Hours\n🕒 更新免打扰时间"
  },
  learning: {
    relatedOptimizations: ["delivery-optimization"],
    commonMisconceptions: [
      "Active Hours disable Windows Update.",
      "Active Hours guarantee that Windows will never restart."
    ],
    references: []
  }
};
