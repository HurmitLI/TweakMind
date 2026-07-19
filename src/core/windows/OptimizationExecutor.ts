import type { OptimizationId } from "../../types/optimization";
import { toErrorMessage } from "../error/errorMessage";
import { OptimizationRepository } from "../optimization/OptimizationRepository";
import { OptimizationPluginManager } from "../plugins/OptimizationPluginManager";
import { clearStoredScanResult } from "../scan/ScanResult";
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
    status: result.status === "success" ? "Success" : "Failed",
    message: result.message ?? result.error ?? "Optimization completed through the executor.",
    isAdmin: result.applyMode === "real",
    applyMode: result.applyMode
  };
}

/**
 * Best-effort history persistence after native work. A localStorage quota/privacy
 * failure must not reject the executor Promise — Confirm/Recovery would show a
 * false failure and invite a duplicate real apply/restore.
 */
function tryRecordApplyHistory(entry: OptimizationHistoryEntry): void {
  try {
    WindowsOptimizationService.recordHistory(entry);
  } catch {
    // Native apply already finished; keep the synthesized historyEntryId for pending.
  }
}

function tryRecordRecoveryResult(result: OptimizationRecoveryResult): void {
  try {
    WindowsOptimizationService.recordRecoveryResult(result);
  } catch {
    // Native restore (or synthesized failure) already finished.
  }
}

export class OptimizationExecutor {
  static async apply(optimizationId: OptimizationId): Promise<OptimizationApplyResult> {
    const result = await OptimizationPluginManager.apply(optimizationId);
    const historyEntry = toApplyHistoryEntry(result);
    tryRecordApplyHistory(historyEntry);

    if (result.status === "success") {
      clearStoredScanResult();
    }

    return {
      ...result,
      historyEntryId: historyEntry.id
    };
  }

  static async restore(entry: OptimizationHistoryEntry): Promise<OptimizationRecoveryResult> {
    let result: OptimizationRecoveryResult;

    try {
      result = await OptimizationPluginManager.recover(entry.optimizationId, {
        historyEntryId: entry.id
      });
    } catch (error) {
      result = {
        historyEntryId: entry.id,
        optimizationId: entry.optimizationId,
        status: "failed",
        previousState: entry.newState,
        expectedState: entry.previousState,
        actualState: "Unknown",
        error: `Recovery failed: native invoke error (${toErrorMessage(error)}).`,
        timestamp: Math.floor(Date.now() / 1000).toString()
      };
    }

    tryRecordRecoveryResult(result);
    if (result.status === "success") {
      clearStoredScanResult();
    }

    return result;
  }
}
