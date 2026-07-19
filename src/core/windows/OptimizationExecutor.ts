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

type HistoryPersistAttempt = { ok: true } | { ok: false; error: unknown };

/**
 * Best-effort history persistence after native work. A localStorage quota/privacy
 * failure must not reject the executor Promise — Confirm/Recovery would show a
 * false failure and invite a duplicate real apply/restore.
 */
function tryRecordApplyHistory(entry: OptimizationHistoryEntry): HistoryPersistAttempt {
  try {
    WindowsOptimizationService.recordHistory(entry);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

function tryRecordRecoveryResult(result: OptimizationRecoveryResult): HistoryPersistAttempt {
  try {
    WindowsOptimizationService.recordRecoveryResult(result);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

function toHistoryPersistDiagnostic(error: unknown): string {
  return `History could not be persisted (${toErrorMessage(error)}).`;
}

/**
 * After native success, keep status=success (never fake an apply/restore failure)
 * but surface a diagnosable history-persist note. After native failure, leave
 * message/error untouched so storage faults cannot mask the real outcome.
 */
function withHistoryPersistNote<T extends { status: string; message?: string }>(
  result: T,
  persist: HistoryPersistAttempt
): T {
  if (persist.ok || result.status !== "success") {
    return result;
  }

  const note = toHistoryPersistDiagnostic(persist.error);
  const existing = result.message?.trim();

  return {
    ...result,
    message: existing ? `${existing} ${note}` : note
  };
}

export class OptimizationExecutor {
  static async apply(optimizationId: OptimizationId): Promise<OptimizationApplyResult> {
    const result = await OptimizationPluginManager.apply(optimizationId);
    const historyEntry = toApplyHistoryEntry(result);
    const persist = tryRecordApplyHistory(historyEntry);
    const settled = withHistoryPersistNote(result, persist);

    if (settled.status === "success") {
      clearStoredScanResult();
    }

    return {
      ...settled,
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

    const persist = tryRecordRecoveryResult(result);
    const settled = withHistoryPersistNote(result, persist);

    if (settled.status === "success") {
      clearStoredScanResult();
    }

    return settled;
  }
}
