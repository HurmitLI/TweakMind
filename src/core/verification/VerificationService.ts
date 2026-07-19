import type { OptimizationId } from "../../types/optimization";
import { toErrorMessage } from "../error/errorMessage";
import { resolveRecoveryVerificationAssociation } from "../execution/targets/RecoveryVerificationSupport";
import { OptimizationPluginManager } from "../plugins/OptimizationPluginManager";
import {
  clearPendingApplyResult,
  clearPendingRecoveryResult,
  readPendingApplyResult,
  readPendingRecoveryResult,
  WindowsOptimizationService
} from "../windows/WindowsOptimizationService";
import type { VerificationResult } from "./VerificationResult";

type VerificationMode = "apply" | "recovery";

interface VerificationOptions {
  mode?: VerificationMode;
  historyEntryId?: string;
  /**
   * When false, skip history recording and pending apply/recovery consumption.
   * The caller must invoke commitVerification() only after accepting the result
   * as the current VerificationPage attempt (avoids stale Promise side effects).
   * Defaults to true for existing call sites and unit tests.
   */
  commitSideEffects?: boolean;
}

function failedVerification(
  optimizationId: OptimizationId,
  historyEntryId: string | undefined,
  message: string
): VerificationResult {
  return {
    historyEntryId,
    optimizationId,
    status: "Failed",
    previousState: "Unknown",
    expectedState: "Unknown",
    actualState: "Unknown",
    message,
    timestamp: Math.floor(Date.now() / 1000).toString()
  };
}

function consumePendingApplyResult(optimizationId: OptimizationId, verificationResult: VerificationResult) {
  if (verificationResult.status !== "Verified" && verificationResult.status !== "Failed") {
    return;
  }

  const pendingApplyResult = readPendingApplyResult(optimizationId);

  if (!pendingApplyResult) {
    return;
  }

  // Keep the pending slot when verification targeted a different history entry.
  if (
    pendingApplyResult.historyEntryId &&
    verificationResult.historyEntryId &&
    pendingApplyResult.historyEntryId !== verificationResult.historyEntryId
  ) {
    return;
  }

  clearPendingApplyResult(optimizationId);
}

function unavailableRecoveryVerification(
  optimizationId: OptimizationId,
  historyEntryId: string | undefined,
  message: string
): VerificationResult {
  return {
    historyEntryId,
    optimizationId,
    status: "Pending / Not Available",
    previousState: "Unknown",
    expectedState: "Unknown",
    actualState: "Unknown",
    message,
    timestamp: Math.floor(Date.now() / 1000).toString()
  };
}

function consumePendingRecoveryResult(
  optimizationId: OptimizationId,
  verificationResult: VerificationResult
) {
  if (verificationResult.status !== "Verified" && verificationResult.status !== "Failed") {
    return;
  }

  const historyEntryId = verificationResult.historyEntryId;

  if (!historyEntryId) {
    return;
  }

  // Refuse consume when the terminal result is associated with a different optimization.
  if (verificationResult.optimizationId !== optimizationId) {
    return;
  }

  const pendingRecoveryResult = readPendingRecoveryResult(historyEntryId);

  if (!pendingRecoveryResult) {
    return;
  }

  if (pendingRecoveryResult.optimizationId !== optimizationId) {
    return;
  }

  clearPendingRecoveryResult(historyEntryId);
}

export class VerificationService {
  static async verify(optimizationId: OptimizationId, options: VerificationOptions = {}): Promise<VerificationResult> {
    const mode = options.mode ?? "apply";
    const commitSideEffects = options.commitSideEffects !== false;
    let result: VerificationResult;

    if (mode === "recovery") {
      const association = resolveRecoveryVerificationAssociation(optimizationId, options.historyEntryId);

      if (!association.ok) {
        result = unavailableRecoveryVerification(
          optimizationId,
          options.historyEntryId,
          association.reason === "mismatch"
            ? "Recovery verification target does not match this optimization or history entry."
            : "No completed Recovery result was found. Verification is pending."
        );

        if (commitSideEffects) {
          this.commitVerification(optimizationId, mode, result);
        }

        return result;
      }
    }

    try {
      result = await OptimizationPluginManager.verify(optimizationId, {
        historyEntryId: options.historyEntryId,
        verificationMode: mode
      });
    } catch (error) {
      result = failedVerification(
        optimizationId,
        options.historyEntryId,
        `Verification failed: native invoke error (${toErrorMessage(error)}).`
      );
    }
    const pendingApplyResult = mode === "apply" ? readPendingApplyResult(optimizationId) : null;
    const historyEntryId = options.historyEntryId ?? result.historyEntryId ?? pendingApplyResult?.historyEntryId;
    const verificationResult = historyEntryId && !result.historyEntryId
      ? {
          ...result,
          historyEntryId
        }
      : result;

    if (commitSideEffects) {
      this.commitVerification(optimizationId, mode, verificationResult);
    }

    return verificationResult;
  }

  /** Record history and consume the matching pending slot for a terminal result. */
  static commitVerification(
    optimizationId: OptimizationId,
    mode: VerificationMode,
    verificationResult: VerificationResult
  ): void {
    if (verificationResult.historyEntryId) {
      WindowsOptimizationService.recordVerification(verificationResult);
    }

    if (mode === "apply") {
      consumePendingApplyResult(optimizationId, verificationResult);
    } else {
      consumePendingRecoveryResult(optimizationId, verificationResult);
    }
  }
}
