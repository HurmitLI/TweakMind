import type { OptimizationId } from "../../types/optimization";
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

export class VerificationService {
  static async verify(optimizationId: OptimizationId, options: VerificationOptions = {}): Promise<VerificationResult> {
    const result = await OptimizationPluginManager.verify(optimizationId, {
      historyEntryId: options.historyEntryId,
      verificationMode: options.mode ?? "apply"
    });
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
