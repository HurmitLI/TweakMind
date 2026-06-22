import type { OptimizationKnowledge } from "../KnowledgeDefinition";
import { scanAvailabilityFor } from "../knowledgeSchemaHelpers";

export const backgroundAppsKnowledge: OptimizationKnowledge = {
  identity: {
    id: "background-apps",
    title: "Background Apps",
    category: "Privacy",
    priority: "Medium",
    tags: ["privacy", "notifications", "battery", "apps"],
    difficulty: "Easy",
    icon: "moon"
  },
  overview: {
    summary: "Explains apps that can continue activity when not open on screen.",
    purpose: "Help you decide which apps should keep running background tasks when they are not open.",
    howWindowsWorks:
      "Windows can allow selected apps to receive updates, notifications, or background tasks even when you are not actively using them.",
    whyItExists:
      "Microsoft added background app permissions so store and modern apps can sync and notify users without staying open."
  },
  currentStatus: {
    supportedWindows: "Windows 10, Windows 11",
    defaultValue: "Unknown",
    currentState: "Unknown",
    scanAvailability: scanAvailabilityFor("background-apps")
  },
  recommendation: {
    recommendedFor: ["Battery-conscious laptop users", "Users reducing distractions", "PCs with many rarely used apps"],
    notRecommendedFor: ["Users relying on real-time notifications", "Messaging-heavy workflows", "Calendar or mail users needing instant sync"],
    typicalScenarios: [
      "You want fewer distractions and can accept delayed notifications from rarely used apps.",
      "You rely on messaging, mail, or calendar apps that need immediate background sync.",
      "You use a laptop on battery and want to reduce background app activity."
    ]
  },
  benefits: {
    performanceImpact: "Medium",
    memoryImpact: "Low",
    batteryImpact: "High",
    latencyImpact: "Low",
    networkImpact: "Low",
    privacyImpact: "Medium"
  },
  tradeOffs: {
    pros: ["May reduce background activity", "Can reduce notifications from unused apps", "May improve battery life on mobile PCs"],
    cons: ["Less background convenience", "Possible delayed app updates", "Requires choosing apps thoughtfully"],
    possibleSideEffects: [
      "Notifications may arrive later",
      "Some apps may sync only when opened",
      "Messaging or calendar apps can feel less immediate"
    ]
  },
  risks: {
    riskLevel: "Low",
    riskExplanation:
      "The change is reversible and app-specific, but delayed notifications can be confusing if the user forgets what changed.",
    whenNotToUse: ["Users relying on real-time notifications", "Messaging-heavy workflows", "Calendar or mail users needing instant sync"]
  },
  recovery: {
    recoveryMethod: "Restore background app permissions for apps that need notifications or sync.",
    recoveryDifficulty: "Easy",
    estimatedTime: "About 2 minutes",
    expectedResult: "Apps regain their previous notification and background sync behavior."
  },
  decisionSupport: {
    expectedBenefit: "Medium",
    confidence: "Medium",
    decisionNotes: "Prefer reviewing app-by-app instead of turning off everything blindly."
  },
  terminology: {
    original: "Background Apps",
    localized: "Background Apps（后台应用）",
    tweakmind: "Background Apps\n🌙 后台小助手"
  },
  learning: {
    relatedOptimizations: ["startup-apps", "power-plan"],
    commonMisconceptions: [
      "Turning off all background apps improves security by itself.",
      "Background apps and startup apps are the same setting."
    ],
    references: []
  }
};
