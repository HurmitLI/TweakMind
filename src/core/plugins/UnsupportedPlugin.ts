import type { OptimizationId } from "../../types/optimization";
import { createEngineResult } from "../engine/OptimizationEngine";
import type { OptimizationEngineResult } from "../engine/OptimizationEngine";
import type {
  ApplyExecutionResult,
  RecoveryExecutionResult,
  VerificationExecutionResult
} from "../execution/OptimizationExecutionTypes";
import { nowTimestamp } from "../execution/targets/ExecutionRuntime";
import type {
  OptimizationPlugin,
  OptimizationPluginCapabilities,
  OptimizationPluginContext
} from "./OptimizationPluginTypes";

const unsupportedCapabilities: OptimizationPluginCapabilities = {
  canRealApply: false,
  canVerify: false,
  canRecover: false,
  applyMode: "unsupported",
  verificationMode: "unsupported",
  recoveryMode: "unsupported"
};

export class UnsupportedPlugin implements OptimizationPlugin {
  capabilities = unsupportedCapabilities;
  knowledgeId: OptimizationId;

  constructor(public id: OptimizationId) {
    this.knowledgeId = id;
  }

  async scan(context?: OptimizationPluginContext): Promise<OptimizationEngineResult> {
    if (context?.scan) {
      return context.scan();
    }

    return createEngineResult({
      status: "Failed",
      success: false,
      previousState: "Unknown",
      currentState: "Unknown",
      message: "Detection is not available for this optimization yet."
    });
  }

  async apply(): Promise<ApplyExecutionResult> {
    return {
      optimizationId: this.id,
      applyMode: "unsupported",
      status: "unsupported",
      previousState: "Unknown",
      currentState: "Unknown",
      error: "Real Apply is not available for this optimization yet. No Windows changes were made.",
      timestamp: nowTimestamp()
    };
  }

  async verify(context?: OptimizationPluginContext): Promise<VerificationExecutionResult> {
    return {
      historyEntryId: context?.historyEntryId,
      optimizationId: this.id,
      status: "Pending / Not Available",
      previousState: "Unknown",
      expectedState: "Unknown",
      actualState: "Unknown",
      message:
        context?.verificationMode === "recovery"
          ? "Recovery verification is not available for this optimization yet."
          : "Verification is not available for this optimization yet.",
      timestamp: nowTimestamp()
    };
  }

  async recover(context?: OptimizationPluginContext): Promise<RecoveryExecutionResult> {
    return {
      historyEntryId: context?.historyEntryId ?? "",
      optimizationId: this.id,
      status: "unsupported",
      previousState: "Unknown",
      expectedState: "Unknown",
      actualState: "Unknown",
      error: "Recovery is not available for this optimization yet. No Windows changes were made.",
      timestamp: nowTimestamp()
    };
  }
}
