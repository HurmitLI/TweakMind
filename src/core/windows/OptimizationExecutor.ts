import type { OptimizationId } from "../../types/optimization";
import { OptimizationRepository } from "../optimization/OptimizationRepository";
import { invoke } from "@tauri-apps/api/core";
import {
  type OptimizationApplyMode,
  type OptimizationApplyResult,
  type OptimizationHistoryEntry,
  WindowsOptimizationService
} from "./WindowsOptimizationService";

function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

function targetStateFor(optimizationId: OptimizationId) {
  return optimizationId === "windows-search" ? "Disabled" : "Unknown";
}

function unsupportedResult(optimizationId: OptimizationId, error: string): OptimizationApplyResult {
  return {
    optimizationId,
    applyMode: "unsupported",
    status: "failed",
    previousState: "Unknown",
    error,
    timestamp: Math.floor(Date.now() / 1000).toString()
  };
}

function normalizeNativeApplyResult(result: OptimizationApplyResult): OptimizationApplyResult {
  return {
    optimizationId: result.optimizationId,
    applyMode: result.applyMode,
    status: result.status,
    previousState: result.previousState ?? "Unknown",
    error: result.error ?? null,
    timestamp: result.timestamp
  };
}

function toHistoryEntry(result: OptimizationApplyResult): OptimizationHistoryEntry {
  const optimization = OptimizationRepository.getById(result.optimizationId);

  return {
    id: `${result.optimizationId}-${result.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    optimizationId: result.optimizationId,
    optimizationName: optimization?.title ?? result.optimizationId,
    previousState: result.previousState,
    newState: targetStateFor(result.optimizationId),
    previousStartupType: "Service Control Manager",
    timestamp: result.timestamp,
    status: "Success",
    message: `${optimization?.title ?? result.optimizationId} real apply completed. Previous state was ${result.previousState}.`,
    isAdmin: result.applyMode === "real",
    applyMode: result.applyMode
  };
}

export class OptimizationExecutor {
  static async apply(optimizationId: OptimizationId): Promise<OptimizationApplyResult> {
    if (optimizationId !== "windows-search") {
      return unsupportedResult(
        optimizationId,
        "A real apply executor is not implemented for this optimization yet. No Windows changes were made."
      );
    }

    if (!isTauriRuntime()) {
      return unsupportedResult(
        optimizationId,
        "Real Windows apply is only available in the Tauri desktop app. No Windows changes were made."
      );
    }

    try {
      const result = normalizeNativeApplyResult(await invoke<OptimizationApplyResult>("apply_windows_search"));

      if (result.status === "success") {
        WindowsOptimizationService.recordHistory(toHistoryEntry(result));
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      return {
        optimizationId,
        applyMode: "real" satisfies OptimizationApplyMode,
        status: "failed",
        previousState: "Unknown",
        error: message,
        timestamp: Math.floor(Date.now() / 1000).toString()
      };
    }
  }

  static async restore(entry: OptimizationHistoryEntry): Promise<OptimizationHistoryEntry> {
    return {
      ...entry,
      id: `${entry.optimizationId}-${Math.floor(Date.now() / 1000)}-${Math.random().toString(36).slice(2, 8)}`,
      status: "Failed",
      message: "Restore is not implemented yet. No Windows changes were made."
    };
  }
}
