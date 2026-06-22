import type { OptimizationId } from "../../types/optimization";
import type { OptimizationEngineResult } from "../engine/OptimizationEngine";
import type {
  ApplyExecutionResult,
  ExecutionMode,
  RecoveryExecutionResult,
  VerificationExecutionResult
} from "../execution/OptimizationExecutionTypes";

export interface OptimizationPluginCapabilities {
  canRealApply: boolean;
  canVerify: boolean;
  canRecover: boolean;
  applyMode: ExecutionMode;
  verificationMode: ExecutionMode;
  recoveryMode: ExecutionMode;
}

export interface OptimizationPluginContext {
  scan?: () => Promise<OptimizationEngineResult>;
  historyEntryId?: string;
  verificationMode?: "apply" | "recovery";
}

export interface OptimizationPlugin {
  id: OptimizationId;
  knowledgeId: OptimizationId;
  capabilities: OptimizationPluginCapabilities;
  scan(context?: OptimizationPluginContext): Promise<OptimizationEngineResult>;
  apply(context?: OptimizationPluginContext): Promise<ApplyExecutionResult>;
  verify(context?: OptimizationPluginContext): Promise<VerificationExecutionResult>;
  recover(context?: OptimizationPluginContext): Promise<RecoveryExecutionResult>;
}
