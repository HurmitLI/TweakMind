import type { OptimizationKnowledge } from "../KnowledgeDefinition";
import { scanAvailabilityFor } from "../knowledgeSchemaHelpers";

export const visualEffectsKnowledge: OptimizationKnowledge = {
  identity: {
    id: "visual-effects",
    title: "Visual Effects",
    category: "Performance",
    priority: "Low",
    tags: ["ui", "animations", "accessibility", "responsiveness"],
    difficulty: "Easy",
    icon: "sparkles"
  },
  overview: {
    summary: "Explains Windows animations, shadows, and visual polish settings.",
    purpose: "Help you decide whether reducing visual effects improves comfort or responsiveness on your PC.",
    howWindowsWorks:
      "Visual Effects control interface animations, shadows, transparency-like polish, and other presentation details.",
    whyItExists:
      "Microsoft added visual effects to make Windows feel modern and provide visual feedback during navigation."
  },
  currentStatus: {
    supportedWindows: "Windows 10, Windows 11",
    defaultValue: "Default",
    currentState: "Unknown",
    scanAvailability: scanAvailabilityFor("visual-effects")
  },
  recommendation: {
    recommendedFor: ["Low-end PCs", "Remote desktop users", "Users who prefer minimal motion"],
    notRecommendedFor: ["Users who value Windows 11 visual polish", "Modern PCs with smooth UI already", "Accessibility workflows relying on visual cues"],
    typicalScenarios: [
      "You use a low-end PC or remote desktop session and want a simpler interface.",
      "You prefer Windows visual polish and smooth animations.",
      "You rely on visual cues for accessibility and should change effects carefully."
    ]
  },
  benefits: {
    performanceImpact: "Low",
    memoryImpact: "Low",
    batteryImpact: "Low",
    latencyImpact: "Low",
    networkImpact: "None",
    privacyImpact: "None"
  },
  tradeOffs: {
    pros: ["May improve perceived responsiveness", "Can reduce animation distraction", "Helpful on low-end or remote desktop setups"],
    cons: ["Less animation and polish", "Potentially harsher UI transitions", "Reduced visual feedback"],
    possibleSideEffects: ["Windows may feel less modern", "Some visual cues become less noticeable", "Benefit may be small on modern hardware"]
  },
  risks: {
    riskLevel: "Low",
    riskExplanation:
      "Visual effect changes are easy to reverse and do not affect files, security, or core system behavior.",
    whenNotToUse: [
      "Users who value Windows 11 visual polish",
      "Modern PCs with smooth UI already",
      "Accessibility workflows relying on visual cues"
    ]
  },
  recovery: {
    recoveryMethod: "Restore the previous Visual Effects selection in Windows performance settings.",
    recoveryDifficulty: "Easy",
    estimatedTime: "About 1 minute",
    expectedResult: "Windows restores the previous animation and visual polish behavior."
  },
  decisionSupport: {
    expectedBenefit: "Low",
    confidence: "Medium",
    decisionNotes: "This is mainly a comfort and responsiveness preference, not a guaranteed performance upgrade."
  },
  terminology: {
    original: "Visual Effects",
    localized: "Visual Effects（视觉效果）",
    tweakmind: "Visual Effects\n✨ 界面动效装饰"
  },
  learning: {
    relatedOptimizations: ["game-mode", "hags"],
    commonMisconceptions: [
      "Disabling visual effects always creates large FPS gains in games.",
      "Visual effects and Game Mode solve the same problem."
    ],
    references: []
  }
};
