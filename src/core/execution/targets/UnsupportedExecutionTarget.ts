import type { OptimizationId } from "../../../types/optimization";
import type {
  ApplyExecutionResult,
  OptimizationExecutionCapabilities,
  OptimizationExecutionTarget,
  RecoveryExecutionResult,
  VerificationExecutionResult
} from "../OptimizationExecutionTypes";
import { nowTimestamp } from "./ExecutionRuntime";

const capabilities: OptimizationExecutionCapabilities = {
  canRealApply: false,
  canVerify: false,
  canRecover: false,
  applyMode: "unsupported",
  verificationMode: "unsupported",
  recoveryMode: "unsupported"
};

export class UnsupportedExecutionTarget implements OptimizationExecutionTarget {
  capabilities = capabilities;

  constructor(public id: OptimizationId) {}

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

  async verifyApply(): Promise<VerificationExecutionResult> {
    return {
      optimizationId: this.id,
      status: "Pending / Not Available",
      previousState: "Unknown",
      expectedState: "Unknown",
      actualState: "Unknown",
      message: "Verification is not available for this optimization yet.",
      timestamp: nowTimestamp()
    };
  }

  async verifyRecovery(historyEntryId: string): Promise<VerificationExecutionResult> {
    return {
      historyEntryId,
      optimizationId: this.id,
      status: "Pending / Not Available",
      previousState: "Unknown",
      expectedState: "Unknown",
      actualState: "Unknown",
      message: "Recovery verification is not available for this optimization yet.",
      timestamp: nowTimestamp()
    };
  }

  async recover(historyEntryId: string): Promise<RecoveryExecutionResult> {
    return {
      historyEntryId,
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
