import type { OptimizationId } from "../../types/optimization";
import { KnowledgeRepository } from "../knowledge/KnowledgeRepository";
import type { DetectionConfidence } from "./RuntimeScanModel";

export type ScanCapabilityLevel = "Native Detection" | "Not Supported Yet";

export interface ScanCapabilityDefinition {
  optimizationId: OptimizationId;
  title: string;
  scanCapability: ScanCapabilityLevel;
  detectionMethod: string;
  nativeCommand?: string;
  detectionConfidenceWhenDetected: DetectionConfidence;
  unavailableReason?: string;
}

const capabilities: ScanCapabilityDefinition[] = [
  {
    optimizationId: "windows-search",
    title: "Windows Search",
    scanCapability: "Native Detection",
    detectionMethod: "Windows Service Control Manager (WSearch service state)",
    nativeCommand: "detect_windows_search",
    detectionConfidenceWhenDetected: "High"
  },
  {
    optimizationId: "game-mode",
    title: "Game Mode",
    scanCapability: "Native Detection",
    detectionMethod: "Registry HKCU\\Software\\Microsoft\\GameBar\\AutoGameModeEnabled",
    nativeCommand: "detect_game_mode",
    detectionConfidenceWhenDetected: "High"
  },
  {
    optimizationId: "core-isolation",
    title: "Core Isolation",
    scanCapability: "Native Detection",
    detectionMethod:
      "Registry HKLM\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity\\Enabled",
    nativeCommand: "detect_core_isolation",
    detectionConfidenceWhenDetected: "High"
  },
  {
    optimizationId: "delivery-optimization",
    title: "Delivery Optimization",
    scanCapability: "Native Detection",
    detectionMethod: "Registry HKLM Delivery Optimization DODownloadMode (policy or config)",
    nativeCommand: "detect_delivery_optimization",
    detectionConfidenceWhenDetected: "High"
  },
  {
    optimizationId: "sysmain",
    title: "SysMain",
    scanCapability: "Native Detection",
    detectionMethod: "Windows Service Control Manager (SysMain service state)",
    nativeCommand: "detect_sysmain",
    detectionConfidenceWhenDetected: "High"
  },
  {
    optimizationId: "hags",
    title: "Hardware-Accelerated GPU Scheduling",
    scanCapability: "Native Detection",
    detectionMethod: "Registry HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\\HwSchMode",
    nativeCommand: "detect_hags",
    detectionConfidenceWhenDetected: "High"
  },
  {
    optimizationId: "power-plan",
    title: "Power Plan",
    scanCapability: "Native Detection",
    detectionMethod: "Registry HKLM active power scheme GUID",
    nativeCommand: "detect_power_plan",
    detectionConfidenceWhenDetected: "Medium"
  },
  {
    optimizationId: "visual-effects",
    title: "Visual Effects",
    scanCapability: "Native Detection",
    detectionMethod: "Registry HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects\\VisualFXSetting",
    nativeCommand: "detect_visual_effects",
    detectionConfidenceWhenDetected: "Medium"
  },
  {
    optimizationId: "windows-update-active-hours",
    title: "Windows Update Active Hours",
    scanCapability: "Native Detection",
    detectionMethod: "Registry HKLM\\SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings active hours values",
    nativeCommand: "detect_active_hours",
    detectionConfidenceWhenDetected: "Medium"
  },
  {
    optimizationId: "background-apps",
    title: "Background Apps",
    scanCapability: "Native Detection",
    detectionMethod: "Registry HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications\\GlobalUserDisabled",
    nativeCommand: "detect_background_apps",
    detectionConfidenceWhenDetected: "Low",
    unavailableReason: "Only the global background apps toggle is detected. Per-app permissions are not scanned in this MVP step."
  },
  {
    optimizationId: "startup-apps",
    title: "Startup Apps",
    scanCapability: "Not Supported Yet",
    detectionMethod: "Startup app inventory is not implemented in this MVP step.",
    detectionConfidenceWhenDetected: "None",
    unavailableReason:
      "Startup app inventory requires user-context enumeration that is not implemented in this MVP scan step."
  }
];

const capabilityMap = new Map(capabilities.map((capability) => [capability.optimizationId, capability]));

export class ScanCapabilityRegistry {
  static getAll(): ScanCapabilityDefinition[] {
    return capabilities;
  }

  static get(id: OptimizationId): ScanCapabilityDefinition {
    const capability = capabilityMap.get(id);

    if (capability) {
      return capability;
    }

    const knowledge = KnowledgeRepository.getById(id);
    return {
      optimizationId: id,
      title: knowledge?.identity.title ?? id,
      scanCapability: "Not Supported Yet",
      detectionMethod: "Not defined",
      detectionConfidenceWhenDetected: "None",
      unavailableReason: "This optimization is not registered in the scan capability registry."
    };
  }

  static hasNativeDetection(id: OptimizationId): boolean {
    return this.get(id).scanCapability === "Native Detection";
  }

  static getNativeCommand(id: OptimizationId): string | undefined {
    return this.get(id).nativeCommand;
  }
}
