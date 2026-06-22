import type { OptimizationId } from "../../types/optimization";
import { OptimizationPluginManager } from "../plugins/OptimizationPluginManager";
import { WindowsOptimizationService } from "../windows/WindowsOptimizationService";
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

    WindowsOptimizationService.recordVerification(result);
    return result;
  }
}
