import type { OptimizationId, OptimizationStatus } from "../../types/optimization";

export type ExecutionMode = "real" | "mock" | "unsupported";
export type ExecutionStatus = "success" | "failed" | "pending" | "unsupported";

export interface PreviousStateSnapshot {
  state: OptimizationStatus;
  startupType?: string;
  capturedAt: string;
}

export interface ApplyExecutionResult {
  historyEntryId?: string;
  optimizationId: OptimizationId;
  applyMode: ExecutionMode;
  status: Extract<ExecutionStatus, "success" | "failed" | "unsupported">;
  previousState: OptimizationStatus;
  currentState: OptimizationStatus;
  previousStartupType?: string;
  message?: string;
  error: string | null;
  timestamp: string;
}

export interface VerificationExecutionResult {
  historyEntryId?: string;
  optimizationId: OptimizationId;
  status: "Verified" | "Failed" | "Pending / Not Available";
  previousState: OptimizationStatus;
  expectedState: OptimizationStatus;
  actualState: OptimizationStatus;
  message: string;
  timestamp: string;
}

export interface RecoveryExecutionResult {
  historyEntryId: string;
  optimizationId: OptimizationId;
  status: Extract<ExecutionStatus, "success" | "failed" | "unsupported">;
  previousState: OptimizationStatus;
  expectedState: OptimizationStatus;
  actualState: OptimizationStatus;
  previousStartupType?: string;
  message?: string;
  error: string | null;
  timestamp: string;
}

export interface OptimizationExecutionCapabilities {
  canRealApply: boolean;
  canVerify: boolean;
  canRecover: boolean;
  applyMode: ExecutionMode;
  verificationMode: ExecutionMode;
  recoveryMode: ExecutionMode;
}

export interface OptimizationExecutionTarget {
  id: OptimizationId;
  capabilities: OptimizationExecutionCapabilities;
  apply(): Promise<ApplyExecutionResult>;
  verifyApply(historyEntryId?: string): Promise<VerificationExecutionResult>;
  verifyRecovery(historyEntryId: string): Promise<VerificationExecutionResult>;
  recover(historyEntryId: string): Promise<RecoveryExecutionResult>;
}
