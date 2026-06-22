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

export class WindowsSearchRecovery {
  async recover(historyEntryId: string): Promise<RecoveryExecutionResult> {
    const entry = WindowsOptimizationService.getHistoryEntry(historyEntryId);

    if (!entry) {
      return {
        historyEntryId,
        optimizationId: "windows-search",
        status: "failed",
        previousState: "Unknown",
        expectedState: "Unknown",
        actualState: "Unknown",
        error: "A valid History record is required before Recovery can start.",
        timestamp: nowTimestamp()
      };
    }

    WindowsOptimizationService.recordRecoveryStarted(entry.id);

    if (entry.optimizationId !== "windows-search" || entry.applyMode !== "real" || entry.status !== "Success") {
      return unsupportedRecoveryResult(entry, "Recovery is available only for successful Windows Search Real Apply records.");
    }

    if (!isTauriRuntime()) {
      return unsupportedRecoveryResult(entry, "Real Recovery is only available inside the Tauri desktop app. No Windows changes were made.");
    }

    try {
      const nativeResult = await invoke<Omit<OptimizationRecoveryResult, "historyEntryId">>("restore_windows_search", {
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
