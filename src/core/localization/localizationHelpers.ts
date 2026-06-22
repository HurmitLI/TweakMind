import type { OptimizationBenefitLevel, OptimizationCategory, OptimizationRiskLevel, OptimizationStatus } from "../../types/optimization";
import type { VerificationStatus } from "../verification/VerificationResult";
import type { OptimizationRecoveryStatus } from "../windows/WindowsOptimizationService";
import { LocalizationService } from "./LocalizationService";
import type { TranslationKey } from "./messages";

export function translateVerificationStatus(status: VerificationStatus): string {
  switch (status) {
    case "Verified":
      return LocalizationService.translate("verify.status.verified");
    case "Failed":
      return LocalizationService.translate("verify.status.failed");
    default:
      return LocalizationService.translate("verify.status.pendingNotAvailable");
  }
}

export function translateRecoveryStatus(status: OptimizationRecoveryStatus): string {
  switch (status) {
    case "Not Started":
      return LocalizationService.translate("history.recoveryStatus.notStarted");
    case "Started":
      return LocalizationService.translate("history.recoveryStatus.started");
    case "Success":
      return LocalizationService.translate("history.recoveryStatus.success");
    case "Failed":
      return LocalizationService.translate("history.recoveryStatus.failed");
  }
}

export function translateHistoryStatus(status: "Success" | "Failed"): string {
  return LocalizationService.translate(status === "Success" ? "history.status.success" : "history.status.failed");
}

export function translateOptimizationStatus(status: OptimizationStatus | "Unknown"): string {
  switch (status) {
    case "Enabled":
      return LocalizationService.translate("status.optimization.enabled");
    case "Disabled":
      return LocalizationService.translate("status.optimization.disabled");
    case "Running":
      return LocalizationService.translate("status.optimization.running");
    case "Stopped":
      return LocalizationService.translate("status.optimization.stopped");
    case "Default":
      return LocalizationService.translate("status.optimization.default");
    default:
      return LocalizationService.translate("status.optimization.unknown");
  }
}

export function translateRiskLevel(level: OptimizationRiskLevel | "Unknown"): string {
  switch (level) {
    case "Low":
      return LocalizationService.translate("risk.low");
    case "Medium":
      return LocalizationService.translate("risk.medium");
    case "High":
      return LocalizationService.translate("risk.high");
    default:
      return LocalizationService.translate("common.value.unknown");
  }
}

export function translateBenefitLevel(level: OptimizationBenefitLevel | "Unknown"): string {
  switch (level) {
    case "High":
      return LocalizationService.translate("benefit.high");
    case "Medium":
      return LocalizationService.translate("benefit.medium");
    case "Low":
      return LocalizationService.translate("benefit.low");
    default:
      return LocalizationService.translate("common.value.unknown");
  }
}

export function translateRecommendation(value: string): string {
  const map: Record<string, TranslationKey> = {
    Recommended: "recommendation.recommended",
    "Keep Default": "recommendation.keepDefault",
    "Keep Enabled": "recommendation.keepEnabled",
    "Already Optimized": "recommendation.alreadyOptimized",
    Optional: "recommendation.optional"
  };

  const key = map[value];
  return key ? LocalizationService.translate(key) : value;
}

export function translateCategory(category: OptimizationCategory | string): string {
  const map: Record<string, TranslationKey> = {
    Performance: "report.filter.category.performance",
    Gaming: "report.filter.category.gaming",
    Security: "report.filter.category.security",
    Network: "report.filter.category.network",
    Privacy: "report.filter.category.privacy",
    Windows: "report.filter.category.windows"
  };

  const key = map[category];
  return key ? LocalizationService.translate(key) : category;
}

export function translateScanDisplayState(value: string): string {
  if (value === "Scan Required") {
    return LocalizationService.translate("scan.display.scanRequired");
  }

  if (value === "Not Supported Yet") {
    return LocalizationService.translate("scan.display.notSupportedYet");
  }

  return translateOptimizationStatus(value as OptimizationStatus);
}

export function translateScanCapability(value: string): string {
  if (value === "Native Detection") {
    return LocalizationService.translate("scan.capability.nativeDetection");
  }

  if (value === "Not Supported Yet") {
    return LocalizationService.translate("scan.capability.notSupportedYet");
  }

  return value;
}

export function translateConfidence(value: string): string {
  const map: Record<string, TranslationKey> = {
    High: "scan.confidence.high",
    Medium: "scan.confidence.medium",
    Low: "scan.confidence.low",
    None: "scan.confidence.none"
  };

  const key = map[value];
  return key ? LocalizationService.translate(key) : value;
}

export function translatePriority(value: string): string {
  const map: Record<string, TranslationKey> = {
    Low: "priority.low",
    Medium: "priority.medium",
    High: "priority.high"
  };

  const key = map[value];
  return key ? LocalizationService.translate(key) : value;
}

export function translateConfidenceLevel(value: string): string {
  const map: Record<string, TranslationKey> = {
    Low: "confidence.low",
    Medium: "confidence.medium",
    High: "confidence.high"
  };

  const key = map[value];
  return key ? LocalizationService.translate(key) : value;
}

export function translateApplyMode(mode: "real" | "mock" | "unsupported"): string {
  return LocalizationService.translate(`applyMode.${mode}`);
}
