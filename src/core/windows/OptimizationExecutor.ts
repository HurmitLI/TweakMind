import type { OptimizationId } from "../../types/optimization";
import { OptimizationExecutionRegistry } from "../execution/OptimizationExecutionRegistry";
import { OptimizationRepository } from "../optimization/OptimizationRepository";
import {
  type OptimizationApplyResult,
  type OptimizationHistoryEntry,
  type OptimizationRecoveryResult,
  WindowsOptimizationService
} from "./WindowsOptimizationService";

function toApplyHistoryEntry(result: OptimizationApplyResult): OptimizationHistoryEntry {
  return {
    id: `${result.optimizationId}-${result.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    optimizationId: result.optimizationId,
    optimizationName: OptimizationRepository.getById(result.optimizationId)?.title ?? result.optimizationId,
    previousState: result.previousState,
    newState: result.currentState,
    previousStartupType: result.previousStartupType ?? "Captured before apply",
    timestamp: result.timestamp,
    status: "Success",
    message: result.message ?? "Optimization completed through the executor.",
    isAdmin: result.applyMode === "real",
    applyMode: result.applyMode
  };
}

export class OptimizationExecutor {
  static async apply(optimizationId: OptimizationId): Promise<OptimizationApplyResult> {
    const target = OptimizationExecutionRegistry.get(optimizationId);
    const result = await target.apply();

    if (result.status === "success") {
      WindowsOptimizationService.recordHistory(toApplyHistoryEntry(result));
    }

    return result;
  }

  static async restore(entry: OptimizationHistoryEntry): Promise<OptimizationRecoveryResult> {
    const target = OptimizationExecutionRegistry.get(entry.optimizationId);
    const result = await target.recover(entry.id);

    WindowsOptimizationService.recordRecoveryResult(result);
    return result;
  }
}
