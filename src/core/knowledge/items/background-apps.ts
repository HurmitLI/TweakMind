import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const backgroundAppsKnowledge: OptimizationKnowledge = {
  id: "background-apps",
  title: "Background Apps",
  category: "Privacy",
  summary: "Explains apps that can continue activity when not open on screen.",
  whatItDoes:
    "Windows can allow selected apps to receive updates, notifications, or background tasks even when you are not actively using them.",
  whyItMatters:
    "Limiting background activity can reduce distractions and resource use, but may delay notifications or sync.",
  why:
    "Background app permissions decide whether apps can keep doing small tasks when they are not in front of you. This is useful for communication and sync apps, but unnecessary apps can add noise.",
  benefits: ["May reduce background activity", "Can reduce notifications from unused apps", "May improve battery life on mobile PCs"],
  risks: ["Notifications may arrive later", "Some apps may sync only when opened", "Messaging or calendar apps can feel less immediate"],
  tradeOffs: ["Less background convenience", "Possible delayed app updates", "Requires choosing apps thoughtfully"],
  recommendedFor: ["Battery-conscious laptop users", "Users reducing distractions", "PCs with many rarely used apps"],
  notRecommendedFor: ["Users relying on real-time notifications", "Messaging-heavy workflows", "Calendar or mail users needing instant sync"],
  risk: { level: "Low" },
  riskAnalysis:
    "The change is reversible and app-specific, but delayed notifications can be confusing if the user forgets what changed.",
  recoveryMethod: "Restore background app permissions for apps that need notifications or sync.",
  expectedBenefit: "Medium",
  userDecisionNotes:
    "Prefer reviewing app-by-app instead of turning off everything blindly.",
  terminology: {
    original: "Background Apps",
    localized: "Background Apps（后台应用）",
    tweakmind: "Background Apps\n🌙 后台小助手"
  },
  recovery: {
    method: "Re-enable background permissions for affected apps in Windows Settings.",
    estimatedTime: "About 2 minutes",
    difficulty: "Easy",
    expectedResult: "Apps regain their previous notification and background sync behavior."
  },
  impact: { performance: 35, privacy: 45, gaming: 15, battery: 60 },
  icon: "moon"
};
