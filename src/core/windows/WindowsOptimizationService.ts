import type { OptimizationId, OptimizationStatus } from "../../types/optimization";

export type OptimizationExecutionStatus = "Success" | "Failed";

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
}

export type OptimizationExecutionResult = OptimizationHistoryEntry;

export const optimizationHistoryStorageKey = "tweakmind:optimization-history";

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

export class WindowsOptimizationService {
  static getHistory(): OptimizationHistoryEntry[] {
    return readHistory();
  }

  static recordHistory(entry: OptimizationHistoryEntry) {
    writeHistory([entry, ...readHistory()]);
  }
}
