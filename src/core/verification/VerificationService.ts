import type { OptimizationId } from "../../types/optimization";
import { toErrorMessage } from "../error/errorMessage";
import { OptimizationPluginManager } from "../plugins/OptimizationPluginManager";
import {
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

export class VerificationService {
  static async verify(optimizationId: OptimizationId, options: VerificationOptions = {}): Promise<VerificationResult> {
    let result: VerificationResult;

    try {
      result = await OptimizationPluginManager.verify(optimizationId, {
        historyEntryId: options.historyEntryId,
        verificationMode: options.mode ?? "apply"
      });
    } catch (error) {
      return failedVerification(
        optimizationId,
        options.historyEntryId,
        `Verification failed: native invoke error (${toErrorMessage(error)}).`
      );
    }
    const pendingApplyResult = (options.mode ?? "apply") === "apply" ? readPendingApplyResult(optimizationId) : null;
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

    return verificationResult;
  }
}
