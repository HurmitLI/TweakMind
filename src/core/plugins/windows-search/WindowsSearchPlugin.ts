import { OptimizationSdkRegistry } from "../../sdk/OptimizationSdkRegistry";
import { WindowsSearchExecutor } from "../../execution/targets/WindowsSearchExecutor";
import { WindowsSearchRecovery } from "../../execution/targets/WindowsSearchRecovery";
import { WindowsSearchVerifier } from "../../execution/targets/WindowsSearchVerifier";
import type {
  ApplyExecutionResult,
  RecoveryExecutionResult,
  VerificationExecutionResult
} from "../../execution/OptimizationExecutionTypes";
import { nowTimestamp } from "../../execution/targets/ExecutionRuntime";
import type { OptimizationEngineResult } from "../../engine/OptimizationEngine";
import type { OptimizationPlugin, OptimizationPluginContext } from "../OptimizationPluginTypes";

const executor = new WindowsSearchExecutor();
const verifier = new WindowsSearchVerifier();
const recovery = new WindowsSearchRecovery();

export const WindowsSearchPlugin: OptimizationPlugin = {
  id: "windows-search",
  knowledgeId: "windows-search",
  capabilities: {
    canRealApply: true,
    canVerify: true,
    canRecover: true,
    applyMode: "real",
    verificationMode: "real",
    recoveryMode: "real"
  },
  scan(): Promise<OptimizationEngineResult> {
    return OptimizationSdkRegistry.detect("windows-search");
  },
  apply(): Promise<ApplyExecutionResult> {
    return executor.apply();
  },
  verify(context?: OptimizationPluginContext): Promise<VerificationExecutionResult> {
    if (context?.verificationMode === "recovery") {
      return verifier.verifyRecovery(context.historyEntryId ?? "");
    }

    return verifier.verifyApply();
  },
  recover(context?: OptimizationPluginContext): Promise<RecoveryExecutionResult> {
    const historyEntryId = context?.historyEntryId;

    if (!historyEntryId) {
      return Promise.resolve({
        historyEntryId: "",
        optimizationId: "windows-search",
        status: "failed",
        previousState: "Unknown",
        expectedState: "Unknown",
        actualState: "Unknown",
        error: "A valid History record is required before Recovery can start.",
        timestamp: nowTimestamp()
      });
    }

    return recovery.recover(historyEntryId);
  }
};
