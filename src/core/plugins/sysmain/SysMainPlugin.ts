import { OptimizationSdkRegistry } from "../../sdk/OptimizationSdkRegistry";
import { SysMainExecutor } from "../../execution/targets/SysMainExecutor";
import { SysMainRecovery } from "../../execution/targets/SysMainRecovery";
import { SysMainVerifier } from "../../execution/targets/SysMainVerifier";
import type {
  ApplyExecutionResult,
  RecoveryExecutionResult,
  VerificationExecutionResult
} from "../../execution/OptimizationExecutionTypes";
import { nowTimestamp } from "../../execution/targets/ExecutionRuntime";
import type { OptimizationEngineResult } from "../../engine/OptimizationEngine";
import type { OptimizationPlugin, OptimizationPluginContext } from "../OptimizationPluginTypes";

const executor = new SysMainExecutor();
const verifier = new SysMainVerifier();
const recovery = new SysMainRecovery();

export const SysMainPlugin: OptimizationPlugin = {
  id: "sysmain",
  knowledgeId: "sysmain",
  capabilities: {
    canRealApply: true,
    canVerify: true,
    canRecover: true,
    applyMode: "real",
    verificationMode: "real",
    recoveryMode: "real"
  },
  scan(): Promise<OptimizationEngineResult> {
    return OptimizationSdkRegistry.detect("sysmain");
  },
  apply(): Promise<ApplyExecutionResult> {
    return executor.apply();
  },
  verify(context?: OptimizationPluginContext): Promise<VerificationExecutionResult> {
    if (context?.verificationMode === "recovery") {
      return verifier.verifyRecovery(context.historyEntryId ?? "");
    }

    return verifier.verifyApply(context?.historyEntryId);
  },
  recover(context?: OptimizationPluginContext): Promise<RecoveryExecutionResult> {
    const historyEntryId = context?.historyEntryId;

    if (!historyEntryId) {
      return Promise.resolve({
        historyEntryId: "",
        optimizationId: "sysmain",
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
