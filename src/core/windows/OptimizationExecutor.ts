import { invoke } from "@tauri-apps/api/core";
import type { OptimizationId } from "../../types/optimization";
import { OptimizationRepository } from "../optimization/OptimizationRepository";
import {
  type OptimizationApplyResult,
  type OptimizationHistoryEntry,
  type OptimizationRecoveryResult,
  WindowsOptimizationService
} from "./WindowsOptimizationService";

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

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

function unsupportedResult(optimizationId: OptimizationId, message: string): OptimizationApplyResult {
  return {
    optimizationId,
    applyMode: "unsupported",
    status: "failed",
    previousState: "Unknown",
    currentState: "Unknown",
    error: message,
    timestamp: Math.floor(Date.now() / 1000).toString()
  };
}

function unsupportedRecoveryResult(entry: OptimizationHistoryEntry, message: string): OptimizationRecoveryResult {
  return {
    historyEntryId: entry.id,
    optimizationId: entry.optimizationId,
    status: "failed",
    previousState: entry.previousState,
    expectedState: entry.previousState,
    actualState: "Unknown",
    previousStartupType: entry.previousStartupType,
    error: message,
    timestamp: Math.floor(Date.now() / 1000).toString()
  };
}

export class OptimizationExecutor {
  static async apply(optimizationId: OptimizationId): Promise<OptimizationApplyResult> {
    if (optimizationId !== "windows-search") {
      return unsupportedResult(
        optimizationId,
        "Real Apply is currently available only for Windows Search. No Windows changes were made."
      );
    }

    if (!isTauriRuntime()) {
      return unsupportedResult(
        optimizationId,
        "Real Windows Apply is only available inside the Tauri desktop app. No Windows changes were made."
      );
    }

    try {
      const result = await invoke<OptimizationApplyResult>("apply_windows_search");

      if (result.status === "success") {
        WindowsOptimizationService.recordHistory(toApplyHistoryEntry(result));
      }

      return result;
    } catch (error) {
      return {
        optimizationId,
        applyMode: "real",
        status: "failed",
        previousState: "Unknown",
        currentState: "Unknown",
        error: error instanceof Error ? error.message : String(error),
        timestamp: Math.floor(Date.now() / 1000).toString()
      };
    }
  }

  static async restore(entry: OptimizationHistoryEntry): Promise<OptimizationRecoveryResult> {
    WindowsOptimizationService.recordRecoveryStarted(entry.id);

    if (entry.optimizationId !== "windows-search" || entry.applyMode !== "real" || entry.status !== "Success") {
      const result = unsupportedRecoveryResult(entry, "Recovery is available only for successful Windows Search Real Apply records.");
      WindowsOptimizationService.recordRecoveryResult(result);
      return result;
    }

    if (!isTauriRuntime()) {
      const result = unsupportedRecoveryResult(entry, "Real Recovery is only available inside the Tauri desktop app. No Windows changes were made.");
      WindowsOptimizationService.recordRecoveryResult(result);
      return result;
    }

    try {
      const nativeResult = await invoke<Omit<OptimizationRecoveryResult, "historyEntryId">>("restore_windows_search", {
        previousState: entry.previousState,
        previousStartupType: entry.previousStartupType
      });
      const result: OptimizationRecoveryResult = {
        ...nativeResult,
        historyEntryId: entry.id
      };
      WindowsOptimizationService.recordRecoveryResult(result);
      return result;
    } catch (error) {
      const result: OptimizationRecoveryResult = {
        historyEntryId: entry.id,
        optimizationId: entry.optimizationId,
        status: "failed",
        previousState: entry.previousState,
        expectedState: entry.previousState,
        actualState: "Unknown",
        previousStartupType: entry.previousStartupType,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Math.floor(Date.now() / 1000).toString()
      };
      WindowsOptimizationService.recordRecoveryResult(result);
      return result;
    }
  }
}
