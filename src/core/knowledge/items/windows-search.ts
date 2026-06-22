import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const windowsSearchKnowledge: OptimizationKnowledge = {
  id: "windows-search",
  title: "Windows Search",
  category: "Performance",
  why:
    "Windows Search maintains an index of files, emails, and selected system locations so results appear quickly. TweakMind evaluates whether that background indexing is worth the resource cost on this PC.",
  benefits: ["Reduced background disk activity", "Slightly lower CPU usage", "Reduced indexing activity"],
  tradeOffs: ["Slower file searching", "Outlook search may become slower", "New files may take longer to appear in search results"],
  recommendedFor: ["Gaming PCs", "Rarely searches files", "Minimal Windows installations"],
  notRecommendedFor: ["Office users", "Outlook users", "Frequent file searching"],
  risk: {
    level: "Low"
  },
  riskAnalysis:
    "The change is easy to reverse and does not remove files or disable security features. The main downside is slower search behavior.",
  recovery: {
    method: "Restore the previous Windows Search service startup configuration from History.",
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
