import type { OptimizationKnowledge } from "../KnowledgeDefinition";
import { scanAvailabilityFor } from "../knowledgeSchemaHelpers";

export const windowsSearchKnowledge: OptimizationKnowledge = {
  identity: {
    id: "windows-search",
    title: "Windows Search",
    category: "Performance",
    priority: "Medium",
    tags: ["indexing", "search", "background activity", "disk"],
    difficulty: "Easy",
    icon: "search"
  },
  overview: {
    summary: "Explains the trade-off between faster search results and background indexing activity.",
    purpose:
      "Help you decide whether Windows Search indexing is worth the background resource cost on this PC.",
    howWindowsWorks:
      "Windows Search builds and maintains an index so files, settings, and some app data can appear quickly in search results.",
    whyItExists:
      "Microsoft added indexing so search feels instant across files, settings, and supported apps instead of scanning the disk on every query."
  },
  currentStatus: {
    supportedWindows: "Windows 10, Windows 11",
    defaultValue: "Enabled",
    currentState: "Unknown",
    scanAvailability: scanAvailabilityFor("windows-search")
  },
  recommendation: {
    recommendedFor: ["Gaming PCs", "Rarely searches files", "Minimal Windows installations"],
    notRecommendedFor: ["Office users", "Outlook users", "Frequent file searching"],
    typicalScenarios: [
      "You rarely use Windows search and notice indexing activity in the background.",
      "You want fewer background disk writes on a gaming or minimal PC.",
      "You rely on Outlook or frequent file search and need results to stay fast."
    ]
  },
  benefits: {
    performanceImpact: "High",
    memoryImpact: "Low",
    batteryImpact: "Medium",
    latencyImpact: "Medium",
    networkImpact: "None",
    privacyImpact: "Low"
  },
  tradeOffs: {
    pros: ["Reduced background disk activity", "Slightly lower CPU usage", "Reduced indexing activity"],
    cons: ["Slower file searching", "Outlook search may become slower", "New files may take longer to appear in search results"],
    possibleSideEffects: [
      "File search may become slower",
      "Outlook or indexed app search can be affected",
      "New files may appear later in search results"
    ]
  },
  risks: {
    riskLevel: "Low",
    riskExplanation:
      "The change is easy to reverse and does not remove files or disable security features. The main downside is slower search behavior.",
    whenNotToUse: ["Office users", "Outlook users", "Frequent file searching"]
  },
  recovery: {
    recoveryMethod: "Restore the saved Windows Search service state from History.",
    recoveryDifficulty: "Easy",
    estimatedTime: "About 1 minute",
    expectedResult: "Windows returns to normal search behavior after the index has time to rebuild."
  },
  decisionSupport: {
    expectedBenefit: "Medium",
    confidence: "Medium",
    decisionNotes:
      "Consider this only if background indexing matters more to you than instant Windows search results."
  },
  terminology: {
    original: "Windows Search",
    localized: "Windows Search（Windows 搜索）",
    tweakmind: "Windows Search\n📚 文件目录管理员"
  },
  learning: {
    relatedOptimizations: ["startup-apps", "sysmain"],
    commonMisconceptions: [
      "Disabling indexing permanently deletes your files.",
      "Windows Search and Windows Search service are unrelated settings."
    ],
    references: []
  }
};
