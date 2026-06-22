import { invoke } from "@tauri-apps/api/core";
import {
  type OptimizationHistoryEntry,
  type OptimizationRecoveryResult,
  WindowsOptimizationService
} from "../../windows/WindowsOptimizationService";
import type { RecoveryExecutionResult } from "../OptimizationExecutionTypes";
import { isTauriRuntime, nowTimestamp } from "./ExecutionRuntime";

function unsupportedRecoveryResult(entry: OptimizationHistoryEntry, message: string): RecoveryExecutionResult {
  return {
    historyEntryId: entry.id,
    optimizationId: entry.optimizationId,
    status: "unsupported",
    previousState: entry.previousState,
    expectedState: entry.previousState,
    actualState: "Unknown",
    previousStartupType: entry.previousStartupType,
    error: message,
    timestamp: nowTimestamp()
  };
}

export class SysMainRecovery {
  async recover(historyEntryId: string): Promise<RecoveryExecutionResult> {
    const entry = WindowsOptimizationService.getHistoryEntry(historyEntryId);

    if (!entry) {
      return {
        historyEntryId,
        optimizationId: "sysmain",
        status: "failed",
        previousState: "Unknown",
        expectedState: "Unknown",
        actualState: "Unknown",
        error: "A valid History record is required before Recovery can start.",
        timestamp: nowTimestamp()
      };
    }

    WindowsOptimizationService.recordRecoveryStarted(entry.id);

    if (entry.optimizationId !== "sysmain" || entry.applyMode !== "real" || entry.status !== "Success") {
      return unsupportedRecoveryResult(entry, "Recovery is available only for successful SysMain Real Apply records.");
    }

    if (!isTauriRuntime()) {
      return unsupportedRecoveryResult(
        entry,
        "Real SysMain Recovery is only available inside the Tauri desktop app. No Windows changes were made."
      );
    }

    try {
      const nativeResult = await invoke<Omit<OptimizationRecoveryResult, "historyEntryId">>("restore_sysmain", {
        previousState: entry.previousState,
        previousStartupType: entry.previousStartupType
      });

      return {
        ...nativeResult,
        historyEntryId: entry.id
      };
    } catch (error) {
      return {
        historyEntryId: entry.id,
        optimizationId: entry.optimizationId,
        status: "failed",
        previousState: entry.previousState,
        expectedState: entry.previousState,
        actualState: "Unknown",
        previousStartupType: entry.previousStartupType,
        error: error instanceof Error ? error.message : String(error),
        timestamp: nowTimestamp()
      };
    }
  }
}
