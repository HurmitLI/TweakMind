import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const windowsSearchKnowledge: OptimizationKnowledge = {
  id: "windows-search",
  title: "Windows Search",
  category: "Performance",
  summary: "Explains the trade-off between faster search results and background indexing activity.",
  whatItDoes:
    "Windows Search builds and maintains an index so files, settings, and some app data can appear quickly in search results.",
  whyItMatters:
    "Indexing can use disk, CPU, and battery in the background, but disabling it can make search feel slower later.",
  why:
    "Windows Search maintains an index of files, emails, and selected system locations so results appear quickly. TweakMind evaluates whether that background indexing is worth the resource cost on this PC.",
  benefits: ["Reduced background disk activity", "Slightly lower CPU usage", "Reduced indexing activity"],
  risks: ["File search may become slower", "Outlook or indexed app search can be affected", "New files may appear later in search results"],
  tradeOffs: ["Slower file searching", "Outlook search may become slower", "New files may take longer to appear in search results"],
  recommendedFor: ["Gaming PCs", "Rarely searches files", "Minimal Windows installations"],
  notRecommendedFor: ["Office users", "Outlook users", "Frequent file searching"],
  risk: {
    level: "Low"
  },
  riskAnalysis:
    "The change is easy to reverse and does not remove files or disable security features. The main downside is slower search behavior.",
  recoveryMethod: "Restore the saved Windows Search service state from History.",
  expectedBenefit: "Medium",
  userDecisionNotes:
    "Consider this only if background indexing matters more to you than instant Windows search results.",
  terminology: {
    original: "Windows Search",
    localized: "Windows Search（Windows 搜索）",
    tweakmind: "Windows Search\n📚 文件目录管理员"
  },
  recovery: {
    method: "Previous state was saved to History for future recovery. Restore is not available in this MVP step.",
    estimatedTime: "About 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows returns to normal search behavior after the index has time to rebuild."
  },
  impact: {
    performance: 75,
    privacy: 10,
    gaming: 55,
    battery: 45
  },
  icon: "search"
};
