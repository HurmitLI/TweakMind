import type { OptimizationKnowledge } from "../KnowledgeDefinition";
import { scanAvailabilityFor } from "../knowledgeSchemaHelpers";

export const startupAppsKnowledge: OptimizationKnowledge = {
  identity: {
    id: "startup-apps",
    title: "Startup Apps",
    category: "Performance",
    priority: "Medium",
    tags: ["startup", "sign-in", "background processes"],
    difficulty: "Medium",
    icon: "power"
  },
  overview: {
    summary: "Explains apps that automatically launch when Windows starts.",
    purpose: "Help you decide which apps should launch automatically after sign-in.",
    howWindowsWorks: "Startup app settings control which apps run automatically after sign-in.",
    whyItExists:
      "Apps add startup entries so tools, sync clients, and tray utilities are ready immediately after sign-in."
  },
  currentStatus: {
    supportedWindows: "Windows 10, Windows 11",
    defaultValue: "Unknown",
    currentState: "Unknown",
    scanAvailability: scanAvailabilityFor("startup-apps")
  },
  recommendation: {
    recommendedFor: ["PCs with slow sign-in", "Users with many tray apps", "Users who know which apps they rarely need"],
    notRecommendedFor: ["Users relying on backup, sync, or security startup tools", "Managed work devices", "Users unsure what an app does"],
    typicalScenarios: [
      "Sign-in feels slow because many apps launch at once.",
      "You rely on backup, sync, or security tools that must start with Windows.",
      "You are unsure what a startup entry does and need to research first."
    ]
  },
  benefits: {
    performanceImpact: "Medium",
    memoryImpact: "Medium",
    batteryImpact: "Medium",
    latencyImpact: "Low",
    networkImpact: "None",
    privacyImpact: "Low"
  },
  tradeOffs: {
    pros: ["Cleaner startup experience", "Potentially fewer background processes after sign-in", "Can reduce early resource contention"],
    cons: ["Less convenience after sign-in", "Manual app launching may be needed", "Requires understanding app purpose"],
    possibleSideEffects: [
      "Cloud sync or device tools may not start automatically",
      "Security or backup utilities should not be disabled casually",
      "Some app features may be delayed"
    ]
  },
  risks: {
    riskLevel: "Medium",
    riskExplanation:
      "Startup changes are reversible, but disabling the wrong app can interrupt sync, backups, device utilities, or expected notifications.",
    whenNotToUse: ["Users relying on backup, sync, or security startup tools", "Managed work devices", "Users unsure what an app does"]
  },
  recovery: {
    recoveryMethod: "Re-enable the app in Startup Apps or the app's own settings.",
    recoveryDifficulty: "Easy",
    estimatedTime: "About 1 minute",
    expectedResult: "The app launches automatically again after the next sign-in."
  },
  decisionSupport: {
    expectedBenefit: "Medium",
    confidence: "Medium",
    decisionNotes:
      "Decide app-by-app. Unknown security, driver, backup, or sync tools should be researched before changing."
  },
  terminology: {
    original: "Startup Apps",
    localized: "Startup Apps（启动应用）",
    tweakmind: "Startup Apps\n🚦 开机排队名单"
  },
  learning: {
    relatedOptimizations: ["background-apps", "sysmain"],
    commonMisconceptions: [
      "Disabling every startup app makes Windows faster on all hardware.",
      "Startup apps and services are the same thing."
    ],
    references: []
  }
};
