import type { OptimizationKnowledge } from "../KnowledgeDefinition";
import { scanAvailabilityFor } from "../knowledgeSchemaHelpers";

export const coreIsolationKnowledge: OptimizationKnowledge = {
  identity: {
    id: "core-isolation",
    title: "Core Isolation",
    category: "Security",
    priority: "High",
    tags: ["security", "memory integrity", "virtualization", "drivers"],
    difficulty: "Medium",
    icon: "shield"
  },
  overview: {
    summary: "Explains the security and compatibility trade-offs of Memory Integrity.",
    purpose:
      "Help you decide whether Core Isolation and Memory Integrity match your security needs and hardware compatibility.",
    howWindowsWorks:
      "Core Isolation and Memory Integrity use virtualization-based protection to isolate sensitive parts of Windows.",
    whyItExists:
      "Microsoft added Memory Integrity to reduce the impact of low-level memory attacks on supported hardware."
  },
  currentStatus: {
    supportedWindows: "Windows 10, Windows 11",
    defaultValue: "Unknown",
    currentState: "Unknown",
    scanAvailability: scanAvailabilityFor("core-isolation")
  },
  recommendation: {
    recommendedFor: ["Most daily-use PCs", "Work laptops", "Users who value security defaults"],
    notRecommendedFor: ["Users diagnosing a known driver conflict", "Specialized test machines", "Legacy hardware setups"],
    typicalScenarios: [
      "You want stronger default security and have compatible hardware and drivers.",
      "You are troubleshooting a driver conflict and need to review isolation settings.",
      "You run legacy hardware or specialized test machines with strict compatibility needs."
    ]
  },
  benefits: {
    performanceImpact: "Low",
    memoryImpact: "Low",
    batteryImpact: "Low",
    latencyImpact: "Low",
    networkImpact: "None",
    privacyImpact: "Medium"
  },
  tradeOffs: {
    pros: [
      "Stronger protection for sensitive system processes",
      "Better defense against some driver-level attacks",
      "Keeps Windows security posture intact"
    ],
    cons: ["May have a small performance cost", "Can conflict with some older drivers", "Requires compatible hardware and firmware"],
    possibleSideEffects: [
      "Turning it off can reduce system protection",
      "Turning it on may reveal incompatible drivers",
      "A restart may be required"
    ]
  },
  risks: {
    riskLevel: "High",
    riskExplanation:
      "This setting affects Windows security isolation and may require a restart. Changing it can reduce protection or expose driver compatibility problems.",
    whenNotToUse: ["Users diagnosing a known driver conflict", "Specialized test machines", "Legacy hardware setups"]
  },
  recovery: {
    recoveryMethod: "Use Windows Security to restore Memory Integrity, then restart if Windows requests it.",
    recoveryDifficulty: "Medium",
    estimatedTime: "About 5 minutes plus restart time",
    expectedResult:
      "Windows restores the previous security posture after restart, assuming compatible drivers are available."
  },
  decisionSupport: {
    expectedBenefit: "Low",
    confidence: "Medium",
    decisionNotes:
      "Security defaults should usually be kept unless you are solving a specific compatibility issue."
  },
  terminology: {
    original: "Core Isolation / Memory Integrity",
    localized: "Core Isolation / Memory Integrity（核心隔离 / 内存完整性）",
    tweakmind: "Core Isolation\n🛡️ 系统内核护盾"
  },
  learning: {
    relatedOptimizations: ["windows-search"],
    commonMisconceptions: [
      "Turning Memory Integrity off removes all Windows security protections.",
      "Memory Integrity always causes major performance loss on every PC."
    ],
    references: []
  }
};
