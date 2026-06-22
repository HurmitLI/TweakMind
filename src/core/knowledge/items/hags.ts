import type { OptimizationKnowledge } from "../KnowledgeDefinition";

export const hagsKnowledge: OptimizationKnowledge = {
  id: "hags",
  title: "Hardware-Accelerated GPU Scheduling",
  category: "Gaming",
  summary: "Explains the Windows graphics scheduling option often called HAGS.",
  whatItDoes:
    "HAGS lets the GPU manage parts of its own scheduling work instead of leaving all scheduling to Windows.",
  whyItMatters:
    "On some driver and hardware combinations it can help latency or consistency, while on others it may do little or introduce instability.",
  why:
    "Hardware-Accelerated GPU Scheduling changes how Windows coordinates graphics work. It is a compatibility-sensitive setting, so the decision should depend on your GPU, driver, and games.",
  benefits: ["May improve frame pacing on some systems", "Can reduce scheduling overhead in supported configurations", "Easy to review before changing"],
  risks: ["Some games or drivers may behave worse", "A restart is usually required", "Benefits are not guaranteed"],
  tradeOffs: ["Possible driver-specific issues", "Requires testing after change", "May have no visible effect"],
  recommendedFor: ["Users testing a specific graphics issue", "Modern GPUs with current drivers", "Gaming PCs where reversibility is understood"],
  notRecommendedFor: ["Stable production workstations", "Users avoiding driver experiments", "Older GPUs or outdated drivers"],
  risk: { level: "Medium" },
  riskAnalysis:
    "The setting is reversible, but graphics scheduling changes can affect stability or game behavior until changed back and restarted.",
  recoveryMethod: "Restore the previous Graphics settings value and restart if Windows requests it.",
  expectedBenefit: "Low",
  userDecisionNotes:
    "Treat HAGS as something to test carefully, not as a guaranteed FPS improvement.",
  terminology: {
    original: "Hardware-Accelerated GPU Scheduling",
    localized: "Hardware-Accelerated GPU Scheduling（硬件加速 GPU 计划）",
    tweakmind: "HAGS\n🎛️ 显卡排班助手"
  },
  recovery: {
    method: "Return Hardware-Accelerated GPU Scheduling to its previous setting.",
    estimatedTime: "About 2 minutes plus restart time",
    difficulty: "Easy",
    expectedResult: "Windows returns to the previous graphics scheduling behavior."
  },
  impact: { performance: 30, privacy: 0, gaming: 45, battery: 5 },
  icon: "gpu"
};
