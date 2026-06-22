import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const sysMainKnowledge: OptimizationKnowledge = {
  id: "sysmain",
  title: "SysMain",
  category: "Performance",
  summary: "Explains Windows app preloading and when background prediction may or may not be useful.",
  whatItDoes:
    "SysMain observes common app usage patterns and may preload data so frequently used apps open more quickly.",
  whyItMatters:
    "Preloading can improve responsiveness on some PCs, but on constrained systems it may add background disk or memory activity.",
  why:
    "SysMain is a Windows service that tries to make frequent apps feel ready sooner by learning usage patterns. The decision depends on whether that prediction helps your PC more than the background activity costs.",
  benefits: ["May reduce launch time for frequently used apps", "Can improve perceived responsiveness", "Requires no manual tuning"],
  risks: ["Background activity may be noticeable on low-end storage", "Disabling it can make common apps open more slowly", "Effects vary by hardware"],
  tradeOffs: ["Less preloading", "Possible slower first launch of common apps", "Background disk activity may decrease"],
  recommendedFor: ["PCs with noticeable background disk activity", "Minimal gaming setups", "Users who rarely reopen the same desktop apps"],
  notRecommendedFor: ["Office PCs that reuse the same apps daily", "Systems with enough RAM and fast storage", "Users who value app launch speed"],
  risk: { level: "Medium" },
  riskAnalysis:
    "SysMain is reversible, but changing it can shift when Windows spends resources: less background prediction may mean slower app launches later.",
  recoveryMethod: "Restore the SysMain service startup setting to its previous value.",
  expectedBenefit: "Medium",
  userDecisionNotes:
    "Consider this only if background activity is a real problem on your PC, not as a universal performance rule.",
  terminology: {
    original: "SysMain",
    localized: "SysMain（系统预加载服务）",
    tweakmind: "SysMain\n🚀 软件预热助手"
  },
  recovery: {
    method: "Restore the previous SysMain service startup setting.",
    estimatedTime: "About 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows returns to its previous app preloading behavior."
  },
  impact: { performance: 50, privacy: 0, gaming: 35, battery: 25 },
  icon: "rocket"
};
