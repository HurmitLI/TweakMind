import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const visualEffectsKnowledge: OptimizationKnowledge = {
  id: "visual-effects",
  title: "Visual Effects",
  category: "Performance",
  summary: "Explains Windows animations, shadows, and visual polish settings.",
  whatItDoes:
    "Visual Effects control interface animations, shadows, transparency-like polish, and other presentation details.",
  whyItMatters:
    "Reducing visual effects can make low-end systems feel snappier, but it also makes Windows feel less polished.",
  why:
    "Visual effects are about perceived smoothness and comfort. Some users prefer a simpler interface, while others value the visual feedback.",
  benefits: ["May improve perceived responsiveness", "Can reduce animation distraction", "Helpful on low-end or remote desktop setups"],
  risks: ["Windows may feel less modern", "Some visual cues become less noticeable", "Benefit may be small on modern hardware"],
  tradeOffs: ["Less animation and polish", "Potentially harsher UI transitions", "Reduced visual feedback"],
  recommendedFor: ["Low-end PCs", "Remote desktop users", "Users who prefer minimal motion"],
  notRecommendedFor: ["Users who value Windows 11 visual polish", "Modern PCs with smooth UI already", "Accessibility workflows relying on visual cues"],
  risk: { level: "Low" },
  riskAnalysis:
    "Visual effect changes are easy to reverse and do not affect files, security, or core system behavior.",
  recoveryMethod: "Restore the previous Visual Effects selection in Windows performance settings.",
  expectedBenefit: "Low",
  userDecisionNotes:
    "This is mainly a comfort and responsiveness preference, not a guaranteed performance upgrade.",
  terminology: {
    original: "Visual Effects",
    localized: "Visual Effects（视觉效果）",
    tweakmind: "Visual Effects\n✨ 界面动效装饰"
  },
  recovery: {
    method: "Return Visual Effects to the previous Windows setting.",
    estimatedTime: "About 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows restores the previous animation and visual polish behavior."
  },
  impact: { performance: 30, privacy: 0, gaming: 10, battery: 15 },
  icon: "sparkles"
};
