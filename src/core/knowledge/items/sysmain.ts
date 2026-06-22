import type { OptimizationKnowledge } from "../KnowledgeDefinition";
import { scanAvailabilityFor } from "../knowledgeSchemaHelpers";

export const sysMainKnowledge: OptimizationKnowledge = {
  identity: {
    id: "sysmain",
    title: "SysMain",
    category: "Performance",
    priority: "Medium",
    tags: ["services", "preloading", "disk", "memory"],
    difficulty: "Easy",
    icon: "rocket"
  },
  overview: {
    summary: "Explains Windows app preloading and when background prediction may or may not be useful.",
    purpose: "Help you decide whether SysMain preloading helps or hurts your daily workflow.",
    howWindowsWorks:
      "SysMain observes common app usage patterns and may preload data so frequently used apps open more quickly.",
    whyItExists:
      "Microsoft added SysMain so Windows can predict frequently used apps and reduce launch delays."
  },
  currentStatus: {
    supportedWindows: "Windows 10, Windows 11",
    defaultValue: "Enabled",
    currentState: "Unknown",
    scanAvailability: scanAvailabilityFor("sysmain")
  },
  recommendation: {
    recommendedFor: ["PCs with noticeable background disk activity", "Minimal gaming setups", "Users who rarely reopen the same desktop apps"],
    notRecommendedFor: ["Office PCs that reuse the same apps daily", "Systems with enough RAM and fast storage", "Users who value app launch speed"],
    typicalScenarios: [
      "Background disk activity is noticeable and you rarely reopen the same apps.",
      "You use the same office apps daily and want them to feel ready quickly.",
      "You have fast storage and enough RAM for preloading to be helpful."
    ]
  },
  benefits: {
    performanceImpact: "Medium",
    memoryImpact: "Medium",
    batteryImpact: "Low",
    latencyImpact: "Medium",
    networkImpact: "None",
    privacyImpact: "None"
  },
  tradeOffs: {
    pros: ["May reduce launch time for frequently used apps", "Can improve perceived responsiveness", "Requires no manual tuning"],
    cons: ["Less preloading", "Possible slower first launch of common apps", "Background disk activity may decrease"],
    possibleSideEffects: [
      "Background activity may be noticeable on low-end storage",
      "Disabling it can make common apps open more slowly",
      "Effects vary by hardware"
    ]
  },
  risks: {
    riskLevel: "Medium",
    riskExplanation:
      "SysMain is reversible, but changing it can shift when Windows spends resources: less background prediction may mean slower app launches later.",
    whenNotToUse: ["Office PCs that reuse the same apps daily", "Systems with enough RAM and fast storage", "Users who value app launch speed"]
  },
  recovery: {
    recoveryMethod: "Restore the SysMain service startup setting to its previous value.",
    recoveryDifficulty: "Easy",
    estimatedTime: "About 1 minute",
    expectedResult: "Windows returns to its previous app preloading behavior."
  },
  decisionSupport: {
    expectedBenefit: "Medium",
    confidence: "Low",
    decisionNotes: "Consider this only if background activity is a real problem on your PC, not as a universal performance rule."
  },
  terminology: {
    original: "SysMain",
    localized: "SysMain（系统预加载服务）",
    tweakmind: "SysMain\n🚀 软件预热助手"
  },
  learning: {
    relatedOptimizations: ["windows-search", "startup-apps"],
    commonMisconceptions: ["SysMain and Superfetch are unrelated legacy names.", "Disabling SysMain always improves gaming performance."],
    references: []
  }
};
