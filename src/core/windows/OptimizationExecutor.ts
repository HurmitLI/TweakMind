import type { OptimizationId } from "../../types/optimization";
import { OptimizationRepository } from "../optimization/OptimizationRepository";
import type { OptimizationEngineResult } from "../engine/OptimizationEngine";
import { OptimizationSdkRegistry } from "../sdk/OptimizationSdkRegistry";
import {
  type OptimizationExecutionResult,
  type OptimizationHistoryEntry,
  WindowsOptimizationService
} from "./WindowsOptimizationService";

function toHistoryEntry(
  optimizationId: OptimizationId,
  result: OptimizationEngineResult,
  previousStartupType = "Engine"
): OptimizationExecutionResult {
  return {
    id: `${optimizationId}-${result.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    optimizationId,
    optimizationName: OptimizationRepository.getById(optimizationId)?.title ?? optimizationId,
    previousState: result.previousState,
    newState: result.currentState,
    previousStartupType,
    timestamp: result.timestamp,
    status: result.status,
    message: result.message,
    isAdmin: true
  };
}

export class OptimizationExecutor {
  static async apply(optimizationId: OptimizationId): Promise<OptimizationExecutionResult> {
    const result = await OptimizationSdkRegistry.get(optimizationId).executor.apply();
    const entry = toHistoryEntry(optimizationId, result);
    WindowsOptimizationService.recordHistory(entry);
    return entry;
  }

  static async restore(entry: OptimizationHistoryEntry): Promise<OptimizationExecutionResult> {
    const result = await OptimizationSdkRegistry.get(entry.optimizationId).recovery.restore(entry.previousState);
    const restoreEntry = toHistoryEntry(entry.optimizationId, result, entry.previousStartupType);
    WindowsOptimizationService.recordHistory(restoreEntry);
    return restoreEntry;
  }
}
