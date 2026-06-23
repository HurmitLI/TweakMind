import type { OptimizationId, OptimizationStatus } from "../../types/optimization";
import type {
  ApplyExecutionResult,
  ExecutionMode,
  RecoveryExecutionResult
} from "../execution/OptimizationExecutionTypes";
import type { VerificationResult, VerificationStatus } from "../verification/VerificationResult";

export type OptimizationExecutionStatus = "Success" | "Failed";
export type OptimizationApplyMode = ExecutionMode;
export type OptimizationApplyStatus = "success" | "failed";
export type OptimizationRecoveryStatus = "Not Started" | "Started" | "Success" | "Failed";

export type OptimizationApplyResult = ApplyExecutionResult;

export type OptimizationRecoveryResult = RecoveryExecutionResult;

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
  verificationStatus?: VerificationStatus;
  verificationExpectedState?: OptimizationStatus;
  verificationActualState?: OptimizationStatus;
  verificationTimestamp?: string;
  recoveryStatus?: OptimizationRecoveryStatus;
  recoveryStartedAt?: string;
  recoveryCompletedAt?: string;
  recoveryExpectedState?: OptimizationStatus;
  recoveryActualState?: OptimizationStatus;
  recoveryMessage?: string;
}

export type OptimizationExecutionResult = OptimizationHistoryEntry;

export const optimizationHistoryStorageKey = "tweakmind:optimization-history";
export const pendingApplyResultStorageKey = "tweakmind:pending-apply-result";
export const pendingRecoveryResultStorageKey = "tweakmind:pending-recovery-result";
export const pendingRecoveryAuthorizationStorageKey = "tweakmind:pending-recovery-authorization";

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

  static getHistoryEntry(id: string): OptimizationHistoryEntry | undefined {
    return readHistory().find((entry) => entry.id === id);
  }

  static recordHistory(entry: OptimizationHistoryEntry) {
    writeHistory([entry, ...readHistory()]);
    return entry;
  }

  static recordVerification(result: VerificationResult) {
    const history = readHistory();
    let updated = false;
    const nextHistory = history.map((entry) => {
      if (
        updated ||
        (result.historyEntryId
          ? entry.id !== result.historyEntryId || entry.optimizationId !== result.optimizationId
          : entry.optimizationId !== result.optimizationId) ||
        entry.status !== "Success"
      ) {
        return entry;
      }

      updated = true;
      return {
        ...entry,
        verificationStatus: result.status,
        verificationExpectedState: result.expectedState,
        verificationActualState: result.actualState,
        verificationTimestamp: result.timestamp
      };
    });

    writeHistory(nextHistory);
  }

  static recordRecoveryStarted(entryId: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    writeHistory(
      readHistory().map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              recoveryStatus: "Started",
              recoveryStartedAt: timestamp
            }
          : entry
      )
    );
  }

  static recordRecoveryResult(result: OptimizationRecoveryResult) {
    writeHistory(
      readHistory().map((entry) =>
        entry.id === result.historyEntryId
          ? {
              ...entry,
              recoveryStatus: result.status === "success" ? "Success" : "Failed",
              recoveryCompletedAt: result.timestamp,
              recoveryExpectedState: result.expectedState,
              recoveryActualState: result.actualState,
              recoveryMessage: result.message ?? result.error ?? "Recovery finished."
            }
          : entry
      )
    );
  }
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

export function storePendingRecoveryResult(result: OptimizationRecoveryResult) {
  window.sessionStorage.setItem(pendingRecoveryResultStorageKey, JSON.stringify(result));
}

export function readPendingRecoveryResult(historyEntryId: string): OptimizationRecoveryResult | null {
  try {
    const stored = window.sessionStorage.getItem(pendingRecoveryResultStorageKey);

    if (!stored) {
      return null;
    }

    const result = JSON.parse(stored) as OptimizationRecoveryResult;
    return result.historyEntryId === historyEntryId ? result : null;
  } catch {
    return null;
  }
}

export function storePendingRecoveryAuthorization(historyEntryId: string) {
  window.sessionStorage.setItem(pendingRecoveryAuthorizationStorageKey, historyEntryId);
}

export function hasPendingRecoveryAuthorization(historyEntryId: string) {
  return window.sessionStorage.getItem(pendingRecoveryAuthorizationStorageKey) === historyEntryId;
}

export function clearPendingRecoveryAuthorization() {
  window.sessionStorage.removeItem(pendingRecoveryAuthorizationStorageKey);
}
