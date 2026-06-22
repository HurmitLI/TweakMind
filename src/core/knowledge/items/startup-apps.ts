import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const startupAppsKnowledge: OptimizationKnowledge = {
  id: "startup-apps",
  title: "Startup Apps",
  category: "Performance",
  summary: "Explains apps that automatically launch when Windows starts.",
  whatItDoes:
    "Startup app settings control which apps run automatically after sign-in.",
  whyItMatters:
    "Reducing unnecessary startup apps can make sign-in feel calmer, but disabling the wrong app can remove useful tray tools or sync.",
  why:
    "Many apps add themselves to startup for convenience. Reviewing them helps decide which apps deserve to launch immediately and which can wait until opened manually.",
  benefits: ["Cleaner startup experience", "Potentially fewer background processes after sign-in", "Can reduce early resource contention"],
  risks: ["Cloud sync or device tools may not start automatically", "Security or backup utilities should not be disabled casually", "Some app features may be delayed"],
  tradeOffs: ["Less convenience after sign-in", "Manual app launching may be needed", "Requires understanding app purpose"],
  recommendedFor: ["PCs with slow sign-in", "Users with many tray apps", "Users who know which apps they rarely need"],
  notRecommendedFor: ["Users relying on backup, sync, or security startup tools", "Managed work devices", "Users unsure what an app does"],
  risk: { level: "Medium" },
  riskAnalysis:
    "Startup changes are reversible, but disabling the wrong app can interrupt sync, backups, device utilities, or expected notifications.",
  recoveryMethod: "Re-enable the app in Startup Apps or the app's own settings.",
  expectedBenefit: "Medium",
  userDecisionNotes:
    "Decide app-by-app. Unknown security, driver, backup, or sync tools should be researched before changing.",
  terminology: {
    original: "Startup Apps",
    localized: "Startup Apps（启动应用）",
    tweakmind: "Startup Apps\n🚦 开机排队名单"
  },
  recovery: {
    method: "Turn the startup entry back on in Windows Startup Apps settings.",
    estimatedTime: "About 1 minute",
    difficulty: "Easy",
    expectedResult: "The app launches automatically again after the next sign-in."
  },
  impact: { performance: 55, privacy: 10, gaming: 20, battery: 30 },
  icon: "power"
};
