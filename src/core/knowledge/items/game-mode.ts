import type { OptimizationKnowledge } from "../KnowledgeDefinition";
import { scanAvailabilityFor } from "../knowledgeSchemaHelpers";

export const gameModeKnowledge: OptimizationKnowledge = {
  identity: {
    id: "game-mode",
    title: "Game Mode",
    category: "Gaming",
    priority: "Medium",
    tags: ["gaming", "background activity", "focus"],
    difficulty: "Easy",
    icon: "gamepad"
  },
  overview: {
    summary: "Helps Windows reduce background interruptions while games are running.",
    purpose: "Help you decide whether enabling Game Mode is worthwhile for your gaming setup.",
    howWindowsWorks:
      "Game Mode tells Windows to prioritize the active game and reduce some background activity during gameplay.",
    whyItExists:
      "Microsoft added Game Mode so Windows can defer non-game work while a full-screen game is running."
  },
  currentStatus: {
    supportedWindows: "Windows 10, Windows 11",
    defaultValue: "Unknown",
    currentState: "Unknown",
    scanAvailability: scanAvailabilityFor("game-mode")
  },
  recommendation: {
    recommendedFor: ["Gaming PCs", "Users who play full-screen games", "Users who want fewer interruptions while gaming"],
    notRecommendedFor: ["Users troubleshooting game compatibility", "Non-gaming workstations", "Managed enterprise devices"],
    typicalScenarios: [
      "You play full-screen games and want fewer background interruptions.",
      "You are troubleshooting overlays or capture tools and need fewer variables.",
      "You use the PC mainly for office work rather than gaming."
    ]
  },
  benefits: {
    performanceImpact: "Medium",
    memoryImpact: "None",
    batteryImpact: "Low",
    latencyImpact: "High",
    networkImpact: "None",
    privacyImpact: "None"
  },
  tradeOffs: {
    pros: ["May reduce background interruptions", "Can improve frame consistency in some games", "Requires no advanced configuration"],
    cons: ["Some systems may see no measurable improvement", "A few overlays or older games may behave differently"],
    possibleSideEffects: [
      "Some games may see no change",
      "Older overlays or capture tools can behave differently",
      "Troubleshooting can be harder if too many gaming settings change at once"
    ]
  },
  risks: {
    riskLevel: "Low",
    riskExplanation:
      "Game Mode is a normal per-user Windows setting and can be changed back without affecting files, apps, or security settings.",
    whenNotToUse: ["Users troubleshooting game compatibility", "Non-gaming workstations", "Managed enterprise devices"]
  },
  recovery: {
    recoveryMethod: "Return Game Mode to its previous Windows Settings value.",
    recoveryDifficulty: "Easy",
    estimatedTime: "Less than 1 minute",
    expectedResult: "Windows uses the previous gaming behavior the next time a game starts."
  },
  decisionSupport: {
    expectedBenefit: "Medium",
    confidence: "Medium",
    decisionNotes: "Useful to consider for gaming PCs, but it should not be treated as a guaranteed performance boost."
  },
  terminology: {
    original: "Game Mode",
    localized: "Game Mode（游戏模式）",
    tweakmind: "Game Mode\n🎮 游戏专注助手"
  },
  learning: {
    relatedOptimizations: ["hags", "visual-effects"],
    commonMisconceptions: ["Game Mode always increases FPS.", "Game Mode replaces GPU driver tuning."],
    references: []
  }
};
