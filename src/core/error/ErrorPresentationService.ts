import type {
  ApplyExecutionResult,
  RecoveryExecutionResult,
  VerificationExecutionResult
} from "../execution/OptimizationExecutionTypes";
import { isTauriRuntime } from "../execution/targets/ExecutionRuntime";
import { LocalizationService } from "../localization/LocalizationService";
import type { OptimizationHistoryEntry } from "../windows/WindowsOptimizationService";

export type ErrorType =
  | "administrator-required"
  | "windows-api-failed"
  | "verification-failed"
  | "recovery-failed"
  | "unsupported-optimization"
  | "unsupported-runtime"
  | "scan-failed"
  | "unknown-error";

export type ErrorPresentationContext = "apply" | "verify" | "recovery" | "history" | "knowledge" | "scan";

export interface ErrorDescriptor {
  type: ErrorType;
  title: string;
  explanation: string;
  possibleReasons?: string[];
  recommendedAction: string;
  retryAvailable: boolean;
  showGoBack: boolean;
  showOpenHistory: boolean;
  showDismiss: boolean;
}

const technicalPatternGroups: Array<{ type: ErrorType; patterns: RegExp[] }> = [
  {
    type: "administrator-required",
    patterns: [/administrator/i, /privileges are required/i, /windows error 5/i, /permission is required/i]
  },
  {
    type: "unsupported-runtime",
    patterns: [/tauri desktop app/i, /only available inside the tauri/i, /only available in the tauri/i]
  },
  {
    type: "unsupported-optimization",
    patterns: [/not available for this optimization/i, /not available yet/i, /unsupported apply/i, /unsupported recovery/i]
  },
  {
    type: "scan-failed",
    patterns: [/scan failed/i, /detection is not available/i, /scan is not available/i, /run a scan/i]
  },
  {
    type: "windows-api-failed",
    patterns: [
      /registry/i,
      /hkey/i,
      /powerget/i,
      /powerset/i,
      /invoke/i,
      /windows error/i,
      /service control/i,
      /open .* failed/i,
      /read .* failed/i,
      /write .* failed/i
    ]
  }
];

function normalizeMessage(message: string | null | undefined): string {
  return (message ?? "").trim();
}

function classifyTechnicalMessage(message: string): ErrorType {
  for (const group of technicalPatternGroups) {
    if (group.patterns.some((pattern) => pattern.test(message))) {
      return group.type;
    }
  }

  return "unknown-error";
}

function baseDescriptor(
  type: ErrorType,
  context: ErrorPresentationContext,
  overrides: Partial<ErrorDescriptor> = {}
): ErrorDescriptor {
  const t = LocalizationService.translate.bind(LocalizationService);

  const unsupportedOptimizationTitle =
    context === "recovery"
      ? t("error.unsupportedOptimization.recoveryTitle")
      : t("error.unsupportedOptimization.applyTitle");

  const unsupportedRuntimeTitle =
    context === "recovery"
      ? t("error.unsupportedRuntime.recoveryTitle")
      : context === "verify"
        ? t("error.unsupportedRuntime.verifyTitle")
        : t("error.unsupportedRuntime.applyTitle");

  const defaults: Record<ErrorType, Omit<ErrorDescriptor, "type">> = {
    "administrator-required": {
      title: t("error.administratorRequired.title"),
      explanation: t("error.administratorRequired.explanation"),
      recommendedAction: t("error.administratorRequired.action"),
      retryAvailable: false,
      showGoBack: true,
      showOpenHistory: false,
      showDismiss: context === "apply"
    },
    "windows-api-failed": {
      title: t("error.windowsApiFailed.title"),
      explanation: t("error.windowsApiFailed.explanation"),
      possibleReasons: [
        t("error.windowsApiFailed.reason.otherApp"),
        t("error.windowsApiFailed.reason.policy"),
        t("error.windowsApiFailed.reason.restart")
      ],
      recommendedAction: t("error.windowsApiFailed.action"),
      retryAvailable: true,
      showGoBack: true,
      showOpenHistory: true,
      showDismiss: context === "apply"
    },
    "verification-failed": {
      title: t("error.verificationFailed.title"),
      explanation: t("error.verificationFailed.explanation"),
      possibleReasons: [
        t("error.verificationFailed.reason.restart"),
        t("error.verificationFailed.reason.otherApp"),
        t("error.verificationFailed.reason.policy")
      ],
      recommendedAction: t("error.verificationFailed.action"),
      retryAvailable: true,
      showGoBack: true,
      showOpenHistory: true,
      showDismiss: false
    },
    "recovery-failed": {
      title: t("error.recoveryFailed.title"),
      explanation: t("error.recoveryFailed.explanation"),
      possibleReasons: [
        t("error.recoveryFailed.reason.incompleteRecord"),
        t("error.recoveryFailed.reason.otherApp"),
        t("error.recoveryFailed.reason.adminRequired")
      ],
      recommendedAction: t("error.recoveryFailed.action"),
      retryAvailable: true,
      showGoBack: true,
      showOpenHistory: true,
      showDismiss: false
    },
    "unsupported-optimization": {
      title: unsupportedOptimizationTitle,
      explanation: t("error.unsupportedOptimization.explanation"),
      recommendedAction: t("error.unsupportedOptimization.action"),
      retryAvailable: false,
      showGoBack: true,
      showOpenHistory: context === "history" || context === "recovery",
      showDismiss: context === "apply" || context === "knowledge"
    },
    "unsupported-runtime": {
      title: unsupportedRuntimeTitle,
      explanation: t("error.unsupportedRuntime.explanation"),
      recommendedAction: t("error.unsupportedRuntime.action"),
      retryAvailable: false,
      showGoBack: true,
      showOpenHistory: false,
      showDismiss: context === "apply" || context === "knowledge"
    },
    "scan-failed": {
      title: t("error.scanRequired.title"),
      explanation: t("error.scanRequired.explanation"),
      recommendedAction: t("error.scanRequired.action"),
      retryAvailable: true,
      showGoBack: true,
      showOpenHistory: false,
      showDismiss: false
    },
    "unknown-error": {
      title: t("error.unknown.title"),
      explanation: t("error.unknown.explanation"),
      recommendedAction: t("error.unknown.action"),
      retryAvailable: true,
      showGoBack: true,
      showOpenHistory: true,
      showDismiss: context === "apply"
    }
  };

  return {
    type,
    ...defaults[type],
    ...overrides
  };
}

export class ErrorPresentationService {
  static classifyTechnicalMessage(message: string | null | undefined): ErrorType {
    const normalized = normalizeMessage(message);

    if (!normalized) {
      return "unknown-error";
    }

    return classifyTechnicalMessage(normalized);
  }

  static fromTechnicalError(
    message: string | null | undefined,
    context: ErrorPresentationContext,
    overrides: Partial<ErrorDescriptor> = {}
  ): ErrorDescriptor {
    const type = overrides.type ?? this.classifyTechnicalMessage(message);
    return baseDescriptor(type, context, overrides);
  }

  static fromApplyResult(result: ApplyExecutionResult): ErrorDescriptor | null {
    if (result.status === "success") {
      return null;
    }

    if (result.status === "unsupported" || result.applyMode === "unsupported") {
      return baseDescriptor(
        isTauriRuntime() ? "unsupported-optimization" : "unsupported-runtime",
        "apply",
        {
          explanation: isTauriRuntime()
            ? LocalizationService.translate("error.applyResult.unsupportedInTauri")
            : LocalizationService.translate("error.applyResult.unsupportedRuntime")
        }
      );
    }

    return this.fromTechnicalError(result.error ?? result.message, "apply");
  }

  static fromRecoveryResult(result: RecoveryExecutionResult): ErrorDescriptor | null {
    if (result.status === "success") {
      return null;
    }

    if (result.status === "unsupported") {
      return baseDescriptor(
        isTauriRuntime() ? "unsupported-optimization" : "unsupported-runtime",
        "recovery"
      );
    }

    return this.fromTechnicalError(result.error ?? result.message, "recovery", {
      type: "recovery-failed"
    });
  }

  static fromVerificationResult(result: VerificationExecutionResult): ErrorDescriptor | null {
    if (result.status !== "Failed") {
      return null;
    }

    return baseDescriptor("verification-failed", "verify");
  }

  static forScanRequired(): ErrorDescriptor {
    return baseDescriptor("scan-failed", "knowledge");
  }

  static forApplyUnavailable(canRealApply: boolean): ErrorDescriptor | null {
    if (canRealApply) {
      return null;
    }

    return baseDescriptor(isTauriRuntime() ? "unsupported-optimization" : "unsupported-runtime", "knowledge");
  }

  static forRuntimeScanUnavailable(reason: string | null | undefined): ErrorDescriptor | null {
    const normalized = normalizeMessage(reason);

    if (!normalized) {
      return null;
    }

    return this.fromTechnicalError(normalized, "knowledge", {
      title: LocalizationService.translate("error.scanNotAvailable.title"),
      recommendedAction: LocalizationService.translate("error.scanNotAvailable.action")
    });
  }

  static forRecoveryUnavailable(): ErrorDescriptor {
    return baseDescriptor("unsupported-optimization", "recovery", {
      title: LocalizationService.translate("error.recoveryUnavailable.title"),
      explanation: LocalizationService.translate("error.recoveryUnavailable.explanation"),
      recommendedAction: LocalizationService.translate("error.recoveryUnavailable.action"),
      showOpenHistory: true
    });
  }

  static forHistoryEntry(entry: OptimizationHistoryEntry): ErrorDescriptor | null {
    if (entry.recoveryStatus === "Failed") {
      return baseDescriptor("recovery-failed", "history");
    }

    if (entry.verificationStatus === "Failed") {
      return baseDescriptor("verification-failed", "history");
    }

    if (entry.status === "Failed") {
      return this.fromTechnicalError(entry.message, "history");
    }

    return null;
  }
}
