import type { OptimizationId } from "../../types/optimization";
import { OptimizationExecutionRegistry } from "../execution/OptimizationExecutionRegistry";
import { WindowsOptimizationService } from "../windows/WindowsOptimizationService";
import type { VerificationResult } from "./VerificationResult";

type VerificationMode = "apply" | "recovery";

interface VerificationOptions {
  mode?: VerificationMode;
  historyEntryId?: string;
}

export class VerificationService {
  static async verify(optimizationId: OptimizationId, options: VerificationOptions = {}): Promise<VerificationResult> {
    const target = OptimizationExecutionRegistry.get(optimizationId);
    const result =
      options.mode === "recovery"
        ? await target.verifyRecovery(options.historyEntryId ?? "")
        : await target.verifyApply();

    WindowsOptimizationService.recordVerification(result);
    return result;
  }
}
