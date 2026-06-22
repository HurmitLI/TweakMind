import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const gameModeKnowledge: OptimizationKnowledge = {
  id: "game-mode",
  title: "Game Mode",
  category: "Gaming",
  summary: "Helps Windows reduce background interruptions while games are running.",
  whatItDoes:
    "Game Mode tells Windows to prioritize the active game and reduce some background activity during gameplay.",
  whyItMatters:
    "It may improve consistency on some systems, but many modern PCs will not show a noticeable difference.",
  why:
    "Game Mode helps Windows reduce background interruptions while a game is running. TweakMind checks the real setting before deciding whether enabling it is worthwhile.",
  benefits: ["May reduce background interruptions", "Can improve frame consistency in some games", "Requires no advanced configuration"],
  risks: ["Some games may see no change", "Older overlays or capture tools can behave differently", "Troubleshooting can be harder if too many gaming settings change at once"],
  tradeOffs: ["Some systems may see no measurable improvement", "A few overlays or older games may behave differently"],
  recommendedFor: ["Gaming PCs", "Users who play full-screen games", "Users who want fewer interruptions while gaming"],
  notRecommendedFor: ["Users troubleshooting game compatibility", "Non-gaming workstations", "Managed enterprise devices"],
  risk: {
    level: "Low"
  },
  riskAnalysis:
    "Game Mode is a normal per-user Windows setting and can be changed back without affecting files, apps, or security settings.",
  recoveryMethod: "Return Game Mode to its previous Windows Settings value.",
  expectedBenefit: "Medium",
  userDecisionNotes:
    "Useful to consider for gaming PCs, but it should not be treated as a guaranteed performance boost.",
  terminology: {
    original: "Game Mode",
    localized: "Game Mode（游戏模式）",
    tweakmind: "Game Mode\n🎮 游戏专注助手"
  },
  recovery: {
    method: "Restore the previous Game Mode registry state from History.",
    estimatedTime: "Less than 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows uses the previous gaming behavior the next time a game starts."
  },
  impact: {
    performance: 45,
    privacy: 0,
    gaming: 85,
    battery: 15
  },
  icon: "gamepad"
};
