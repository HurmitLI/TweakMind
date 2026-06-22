import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const gameModeKnowledge: OptimizationKnowledge = {
  id: "game-mode",
  title: "Game Mode",
  category: "Gaming",
  why:
    "Game Mode helps Windows reduce background interruptions while a game is running. TweakMind checks the real setting before deciding whether enabling it is worthwhile.",
  benefits: ["May reduce background interruptions", "Can improve frame consistency in some games", "Requires no advanced configuration"],
  tradeOffs: ["Some systems may see no measurable improvement", "A few overlays or older games may behave differently"],
  recommendedFor: ["Gaming PCs", "Users who play full-screen games", "Users who want fewer interruptions while gaming"],
  notRecommendedFor: ["Users troubleshooting game compatibility", "Non-gaming workstations", "Managed enterprise devices"],
  risk: {
    level: "Low"
  },
  riskAnalysis:
    "Game Mode is a normal per-user Windows setting and can be changed back without affecting files, apps, or security settings.",
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
