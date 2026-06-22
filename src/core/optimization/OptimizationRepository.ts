import type { OptimizationDefinition, OptimizationId } from "../../types/optimization";

const optimizationDefinitions: OptimizationDefinition[] = [
  {
    id: "windows-search",
    title: "Windows Search",
    category: "Performance",
    risk: {
      level: "Low",
      reason:
        "The change is easy to reverse and does not remove files or disable security features. The main downside is slower search behavior."
    },
    recommendation: "Recommended",
    status: "Unknown",
    description:
      "Windows Search maintains an index of files, emails, and selected system locations so results appear quickly. TweakMind evaluates whether that background indexing is worth the resource cost on this PC.",
    benefits: ["Reduced background disk activity", "Slightly lower CPU usage", "Reduced indexing activity"],
    tradeOffs: ["Slower file searching", "Outlook search may become slower", "New files may take longer to appear in search results"],
    recommendedFor: ["Gaming PCs", "Rarely searches files", "Minimal Windows installations"],
    notRecommendedFor: ["Office users", "Outlook users", "Frequent file searching"],
    recovery: "Restore the previous Windows Search service startup configuration from History.",
    estimatedTime: "About 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows returns to normal search behavior after the index has time to rebuild.",
    impact: {
      performance: 75,
      privacy: 10,
      gaming: 55,
      battery: 45,
      estimatedBenefit: "High"
    },
    icon: "search"
  },
  {
    id: "game-mode",
    title: "Game Mode",
    category: "Gaming",
    risk: {
      level: "Low",
      reason:
        "Game Mode is a normal per-user Windows setting and can be changed back without affecting files, apps, or security settings."
    },
    recommendation: "Keep Enabled",
    status: "Unknown",
    description:
      "Game Mode helps Windows reduce background interruptions while a game is running. TweakMind checks the real setting before deciding whether enabling it is worthwhile.",
    benefits: ["May reduce background interruptions", "Can improve frame consistency in some games", "Requires no advanced configuration"],
    tradeOffs: ["Some systems may see no measurable improvement", "A few overlays or older games may behave differently"],
    recommendedFor: ["Gaming PCs", "Users who play full-screen games", "Users who want fewer interruptions while gaming"],
    notRecommendedFor: ["Users troubleshooting game compatibility", "Non-gaming workstations", "Managed enterprise devices"],
    recovery: "Restore the previous Game Mode registry state from History.",
    estimatedTime: "Less than 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows uses the previous gaming behavior the next time a game starts.",
    impact: {
      performance: 45,
      privacy: 0,
      gaming: 85,
      battery: 15,
      estimatedBenefit: "Medium"
    },
    icon: "gamepad"
  },
  {
    id: "core-isolation",
    title: "Core Isolation",
    category: "Security",
    risk: {
      level: "High",
      reason:
        "This setting affects Windows security isolation and may require a restart. Changing it can reduce protection or expose driver compatibility problems."
    },
    recommendation: "Keep Default",
    status: "Unknown",
    description:
      "Core Isolation uses virtualization-based security features to help protect important Windows processes. TweakMind currently keeps this as a knowledge-backed recommendation until a real implementation exists.",
    benefits: ["Stronger protection for sensitive system processes", "Better defense against some driver-level attacks", "Keeps Windows security posture intact"],
    tradeOffs: ["May have a small performance cost", "Can conflict with some older drivers", "Requires compatible hardware and firmware"],
    recommendedFor: ["Most daily-use PCs", "Work laptops", "Users who value security defaults"],
    notRecommendedFor: ["Users diagnosing a known driver conflict", "Specialized test machines", "Legacy hardware setups"],
    recovery: "Open Windows Security and restore Memory Integrity or Core Isolation settings, then restart if prompted.",
    estimatedTime: "About 5 minutes plus restart time",
    difficulty: "Medium",
    expectedResult: "Windows restores the previous security posture after restart, assuming compatible drivers are available.",
    impact: {
      performance: 20,
      privacy: 30,
      gaming: 20,
      battery: 10,
      estimatedBenefit: "Low"
    },
    icon: "shield"
  },
  {
    id: "delivery-optimization",
    title: "Delivery Optimization",
    category: "Network",
    risk: {
      level: "Medium",
      reason:
        "The setting is reversible, but it can affect how Windows Update uses network bandwidth and may change behavior over time."
    },
    recommendation: "Optional",
    status: "Unknown",
    description:
      "Delivery Optimization can download and share Windows update files with other PCs. TweakMind treats it as optional until the network context is known.",
    benefits: ["Can reduce repeated update downloads", "Useful for multiple Windows PCs on one network", "May make updates more efficient"],
    tradeOffs: ["May use upload bandwidth", "Can be confusing on metered networks", "Less useful for single-PC households"],
    recommendedFor: ["Homes with multiple Windows PCs", "Fast unmetered networks", "Users who understand peer-assisted updates"],
    notRecommendedFor: ["Metered connections", "Slow upload connections", "Single-PC setups"],
    recovery: "Open Windows Update Delivery Optimization settings and restore the previous sharing option.",
    estimatedTime: "About 1 minute",
    difficulty: "Easy",
    expectedResult: "Windows Update returns to the previous download and sharing behavior.",
    impact: {
      performance: 20,
      privacy: 35,
      gaming: 10,
      battery: 25,
      estimatedBenefit: "Medium"
    },
    icon: "network"
  }
];

export class OptimizationRepository {
  static getAll(): OptimizationDefinition[] {
    return optimizationDefinitions;
  }

  static getById(id: OptimizationId): OptimizationDefinition | undefined {
    return optimizationDefinitions.find((optimization) => optimization.id === id);
  }

  static getDefault(): OptimizationDefinition {
    return optimizationDefinitions[0];
  }
}
