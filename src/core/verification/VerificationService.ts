import type { OptimizationId } from "../../types/optimization";
import { toErrorMessage } from "../error/errorMessage";
import { OptimizationPluginManager } from "../plugins/OptimizationPluginManager";
import {
  clearPendingApplyResult,
  readPendingApplyResult,
  WindowsOptimizationService
} from "../windows/WindowsOptimizationService";
import type { VerificationResult } from "./VerificationResult";

type VerificationMode = "apply" | "recovery";

interface VerificationOptions {
  mode?: VerificationMode;
  historyEntryId?: string;
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

export class VerificationService {
  static async verify(optimizationId: OptimizationId, options: VerificationOptions = {}): Promise<VerificationResult> {
    const mode = options.mode ?? "apply";
    let result: VerificationResult;

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

    if (verificationResult.historyEntryId) {
      WindowsOptimizationService.recordVerification(verificationResult);
    }

    if (mode === "apply") {
      consumePendingApplyResult(optimizationId, verificationResult);
    }

    return verificationResult;
  }
}
