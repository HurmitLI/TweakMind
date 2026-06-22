import { invoke } from "@tauri-apps/api/core";
import type { OptimizationId } from "../../types/optimization";
import { OptimizationRepository } from "../optimization/OptimizationRepository";
import type { OptimizationEngineResult } from "../engine/OptimizationEngine";
import { OptimizationSdkRegistry } from "../sdk/OptimizationSdkRegistry";
import {
  type OptimizationApplyResult,
  type OptimizationExecutionResult,
  type OptimizationHistoryEntry,
  WindowsOptimizationService
} from "./WindowsOptimizationService";

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

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
    isAdmin: true,
    applyMode: "mock"
  };
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

  static async restore(entry: OptimizationHistoryEntry): Promise<OptimizationExecutionResult> {
    const result = await OptimizationSdkRegistry.get(entry.optimizationId).recovery.restore(entry.previousState);
    const restoreEntry = toHistoryEntry(entry.optimizationId, result, entry.previousStartupType);
    WindowsOptimizationService.recordHistory(restoreEntry);
    return restoreEntry;
  }
}
