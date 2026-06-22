import type {
  ApplyExecutionResult,
  RecoveryExecutionResult,
  VerificationExecutionResult
} from "../execution/OptimizationExecutionTypes";
import { isTauriRuntime } from "../execution/targets/ExecutionRuntime";
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
  const defaults: Record<ErrorType, Omit<ErrorDescriptor, "type">> = {
    "administrator-required": {
      title: "Administrator Permission Required",
      explanation: "TweakMind needs administrator permission to modify this Windows setting.",
      recommendedAction: "Restart TweakMind as Administrator.",
      retryAvailable: false,
      showGoBack: true,
      showOpenHistory: false,
      showDismiss: context === "apply"
    },
    "windows-api-failed": {
      title: "Windows Setting Could Not Be Changed",
      explanation: "TweakMind could not complete the requested Windows change.",
      possibleReasons: [
        "Another application changed the setting",
        "Windows policy restricted the change",
        "A restart may be required"
      ],
      recommendedAction: "Review the setting in History, then try again if the change is still needed.",
      retryAvailable: true,
      showGoBack: true,
      showOpenHistory: true,
      showDismiss: context === "apply"
    },
    "verification-failed": {
      title: "Verification Failed",
      explanation: "Windows did not reach the expected state.",
      possibleReasons: [
        "Restart required",
        "Another application changed the setting",
        "Policy restriction"
      ],
      recommendedAction: "Retry Verification.",
      retryAvailable: true,
      showGoBack: true,
      showOpenHistory: true,
      showDismiss: false
    },
    "recovery-failed": {
      title: "Recovery Failed",
      explanation: "TweakMind could not restore the saved previous state.",
      possibleReasons: [
        "The saved History record is incomplete",
        "Another application changed the setting",
        "Administrator permission may be required"
      ],
      recommendedAction: "Open History to review the record, then retry Recovery if needed.",
      retryAvailable: true,
      showGoBack: true,
      showOpenHistory: true,
      showDismiss: false
    },
    "unsupported-optimization": {
      title: context === "recovery" ? "Recovery Not Available" : "Apply Not Available",
      explanation: "This optimization is not supported for the requested action in the current MVP step.",
      recommendedAction: "Choose a supported optimization or review the Knowledge Center for available actions.",
      retryAvailable: false,
      showGoBack: true,
      showOpenHistory: context === "history" || context === "recovery",
      showDismiss: context === "apply" || context === "knowledge"
    },
    "unsupported-runtime": {
      title:
        context === "recovery"
          ? "Real Recovery Not Available"
          : context === "verify"
            ? "Real Verification Not Available"
            : "Real Apply Not Available",
      explanation: "Real optimization is available only in the Tauri desktop application.",
      recommendedAction: "Open the desktop version.",
      retryAvailable: false,
      showGoBack: true,
      showOpenHistory: false,
      showDismiss: context === "apply" || context === "knowledge"
    },
    "scan-failed": {
      title: "Scan Required",
      explanation: "TweakMind needs a current scan before this optimization can be evaluated or applied safely.",
      recommendedAction: "Run a scan, then return to this optimization.",
      retryAvailable: true,
      showGoBack: true,
      showOpenHistory: false,
      showDismiss: false
    },
    "unknown-error": {
      title: "Something Went Wrong",
      explanation: "TweakMind could not complete the requested action.",
      recommendedAction: "Try again. If the problem continues, review History or return to the previous step.",
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
            ? "Real Apply is not available for this optimization yet."
            : "Real optimization is available only in the Tauri desktop application."
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
      title: "Scan Not Available",
      recommendedAction: "Run a scan when detection becomes available, or review another optimization."
    });
  }

  static forRecoveryUnavailable(): ErrorDescriptor {
    return baseDescriptor("unsupported-optimization", "recovery", {
      title: "Recovery Not Available",
      explanation: "Recovery is available only for successful Real Apply records with recovery support.",
      recommendedAction: "Open History to review available records.",
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
