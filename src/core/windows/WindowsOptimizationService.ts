import type { OptimizationId, OptimizationStatus } from "../../types/optimization";

export type OptimizationExecutionStatus = "Success" | "Failed";
export type OptimizationApplyMode = "real" | "mock" | "unsupported";
export type OptimizationApplyStatus = "success" | "failed";

export interface OptimizationApplyResult {
  optimizationId: OptimizationId;
  applyMode: OptimizationApplyMode;
  status: OptimizationApplyStatus;
  previousState: OptimizationStatus;
  error: string | null;
  timestamp: string;
}

export interface OptimizationHistoryEntry {
  id: string;
  optimizationId: OptimizationId;
  optimizationName: string;
  previousState: OptimizationStatus;
  newState: OptimizationStatus;
  previousStartupType: string;
  timestamp: string;
  status: OptimizationExecutionStatus;
  message: string;
  isAdmin: boolean;
  applyMode?: OptimizationApplyMode;
}

export type OptimizationExecutionResult = OptimizationHistoryEntry;

export const optimizationHistoryStorageKey = "tweakmind:optimization-history";
export const pendingApplyResultStorageKey = "tweakmind:pending-apply-result";

function readHistory(): OptimizationHistoryEntry[] {
  try {
    const stored = window.localStorage.getItem(optimizationHistoryStorageKey);
    return stored ? (JSON.parse(stored) as OptimizationHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(history: OptimizationHistoryEntry[]) {
  window.localStorage.setItem(optimizationHistoryStorageKey, JSON.stringify(history));
}

export function storePendingApplyResult(result: OptimizationApplyResult) {
  window.sessionStorage.setItem(pendingApplyResultStorageKey, JSON.stringify(result));
}

export function readPendingApplyResult(optimizationId: OptimizationId): OptimizationApplyResult | null {
  try {
    const stored = window.sessionStorage.getItem(pendingApplyResultStorageKey);
    if (!stored) {
      return null;
    }

    const result = JSON.parse(stored) as OptimizationApplyResult;
    return result.optimizationId === optimizationId ? result : null;
  } catch {
    return null;
  }
}

export class WindowsOptimizationService {
  static getHistory(): OptimizationHistoryEntry[] {
    return readHistory();
  }

  static recordHistory(entry: OptimizationHistoryEntry) {
    writeHistory([entry, ...readHistory()]);
  }
}
