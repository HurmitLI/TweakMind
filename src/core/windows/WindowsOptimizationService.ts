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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const executionStatuses = ["success", "failed", "unsupported"] as const;

function isExecutionStatus(value: unknown): boolean {
  return typeof value === "string" && (executionStatuses as readonly string[]).includes(value);
}

export function isValidHistoryEntry(value: unknown): value is OptimizationHistoryEntry {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.optimizationId === "string" &&
    typeof value.optimizationName === "string" &&
    typeof value.previousState === "string" &&
    typeof value.newState === "string" &&
    typeof value.previousStartupType === "string" &&
    typeof value.timestamp === "string" &&
    (value.status === "Success" || value.status === "Failed") &&
    typeof value.message === "string" &&
    typeof value.isAdmin === "boolean"
  );
}

export function isValidApplyResult(value: unknown): value is OptimizationApplyResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.optimizationId === "string" &&
    typeof value.applyMode === "string" &&
    isExecutionStatus(value.status) &&
    typeof value.previousState === "string" &&
    typeof value.currentState === "string" &&
    typeof value.timestamp === "string" &&
    (value.error === null || typeof value.error === "string")
  );
}

export function isValidRecoveryResult(value: unknown): value is OptimizationRecoveryResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.historyEntryId === "string" &&
    typeof value.optimizationId === "string" &&
    isExecutionStatus(value.status) &&
    typeof value.previousState === "string" &&
    typeof value.expectedState === "string" &&
    typeof value.actualState === "string" &&
    typeof value.timestamp === "string" &&
    (value.error === null || typeof value.error === "string")
  );
}

function readHistory(): OptimizationHistoryEntry[] {
  try {
    const stored = window.localStorage.getItem(optimizationHistoryStorageKey);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    // Corrupt entries are ignored so one bad record cannot poison the
    // Recovery Center; valid entries are preserved untouched.
    return parsed.filter(isValidHistoryEntry);
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

function storePendingValue(storageKey: string, value: unknown) {
  const serialized = JSON.stringify(value);
  window.sessionStorage.setItem(storageKey, serialized);
  window.localStorage.setItem(storageKey, serialized);
}

type PendingApplyMap = Record<string, OptimizationApplyResult>;

function readPendingApplyMapFromStorage(storage: Storage): PendingApplyMap {
  try {
    const stored = storage.getItem(pendingApplyResultStorageKey);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as unknown;

    // Legacy single-slot payload from older builds.
    if (isValidApplyResult(parsed)) {
      return { [parsed.optimizationId]: parsed };
    }

    if (!isRecord(parsed)) {
      return {};
    }

    const map: PendingApplyMap = {};

    for (const value of Object.values(parsed)) {
      if (!isValidApplyResult(value)) {
        continue;
      }

      // Always key by the result's own optimizationId to avoid wrong association
      // when a corrupt map key does not match the embedded id.
      map[value.optimizationId] = value;
    }

    return map;
  } catch {
    return {};
  }
}

function readMergedPendingApplyMap(): PendingApplyMap {
  const localMap = readPendingApplyMapFromStorage(window.localStorage);
  const sessionMap = readPendingApplyMapFromStorage(window.sessionStorage);

  // Session wins per optimization id when both copies exist.
  return { ...localMap, ...sessionMap };
}

function writePendingApplyMap(map: PendingApplyMap) {
  if (Object.keys(map).length === 0) {
    window.sessionStorage.removeItem(pendingApplyResultStorageKey);
    window.localStorage.removeItem(pendingApplyResultStorageKey);
    return;
  }

  storePendingValue(pendingApplyResultStorageKey, map);
}

export function storePendingApplyResult(result: OptimizationApplyResult) {
  const map = readMergedPendingApplyMap();
  map[result.optimizationId] = result;
  writePendingApplyMap(map);
}

export function readPendingApplyResult(optimizationId: OptimizationId): OptimizationApplyResult | null {
  const result = readMergedPendingApplyMap()[optimizationId];

  if (!result || result.optimizationId !== optimizationId) {
    return null;
  }

  return result;
}

export function clearPendingApplyResult(optimizationId?: OptimizationId) {
  if (!optimizationId) {
    window.sessionStorage.removeItem(pendingApplyResultStorageKey);
    window.localStorage.removeItem(pendingApplyResultStorageKey);
    return;
  }

  const map = readMergedPendingApplyMap();

  if (!(optimizationId in map)) {
    return;
  }

  delete map[optimizationId];
  writePendingApplyMap(map);
}

type PendingRecoveryMap = Record<string, OptimizationRecoveryResult>;

function readPendingRecoveryMapFromStorage(storage: Storage): PendingRecoveryMap {
  try {
    const stored = storage.getItem(pendingRecoveryResultStorageKey);

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as unknown;

    // Legacy single-slot payload from older builds.
    if (isValidRecoveryResult(parsed)) {
      return { [parsed.historyEntryId]: parsed };
    }

    if (!isRecord(parsed)) {
      return {};
    }

    const map: PendingRecoveryMap = {};

    for (const value of Object.values(parsed)) {
      if (!isValidRecoveryResult(value)) {
        continue;
      }

      // Always key by the result's own historyEntryId to avoid wrong association
      // when a corrupt map key does not match the embedded id.
      map[value.historyEntryId] = value;
    }

    return map;
  } catch {
    return {};
  }
}

function readMergedPendingRecoveryMap(): PendingRecoveryMap {
  const localMap = readPendingRecoveryMapFromStorage(window.localStorage);
  const sessionMap = readPendingRecoveryMapFromStorage(window.sessionStorage);

  // Session wins per history entry id when both copies exist.
  return { ...localMap, ...sessionMap };
}

function writePendingRecoveryMap(map: PendingRecoveryMap) {
  if (Object.keys(map).length === 0) {
    window.sessionStorage.removeItem(pendingRecoveryResultStorageKey);
    window.localStorage.removeItem(pendingRecoveryResultStorageKey);
    return;
  }

  storePendingValue(pendingRecoveryResultStorageKey, map);
}

export function storePendingRecoveryResult(result: OptimizationRecoveryResult) {
  const map = readMergedPendingRecoveryMap();
  map[result.historyEntryId] = result;
  writePendingRecoveryMap(map);
}

export function readPendingRecoveryResult(historyEntryId: string): OptimizationRecoveryResult | null {
  const result = readMergedPendingRecoveryMap()[historyEntryId];

  if (!result || result.historyEntryId !== historyEntryId) {
    return null;
  }

  return result;
}

export function storePendingRecoveryAuthorization(historyEntryId: string) {
  // Authorization is a one-session confirm gate. Persisting it in localStorage
  // would let /recovery?historyId=… auto-run after an app restart without a
  // fresh confirmation click.
  window.sessionStorage.setItem(pendingRecoveryAuthorizationStorageKey, historyEntryId);

  try {
    window.localStorage.removeItem(pendingRecoveryAuthorizationStorageKey);
  } catch {
    // Session auth is authoritative; a localStorage cleanup failure must not
    // roll back a successful authorization write.
  }
}

export function hasPendingRecoveryAuthorization(historyEntryId: string) {
  // Drop any legacy durable authorization left by older builds.
  // Best-effort only: privacy/storage policies that reject removeItem must not
  // block reading a valid one-session authorization from sessionStorage.
  try {
    window.localStorage.removeItem(pendingRecoveryAuthorizationStorageKey);
  } catch {
    // Ignore — sessionStorage remains the sole authorization authority.
  }

  return window.sessionStorage.getItem(pendingRecoveryAuthorizationStorageKey) === historyEntryId;
}

export function clearPendingRecoveryAuthorization() {
  window.sessionStorage.removeItem(pendingRecoveryAuthorizationStorageKey);
  window.localStorage.removeItem(pendingRecoveryAuthorizationStorageKey);
}

export function clearPendingRecoveryResult(historyEntryId?: string) {
  if (!historyEntryId) {
    window.sessionStorage.removeItem(pendingRecoveryResultStorageKey);
    window.localStorage.removeItem(pendingRecoveryResultStorageKey);
    return;
  }

  const map = readMergedPendingRecoveryMap();

  if (!(historyEntryId in map)) {
    return;
  }

  delete map[historyEntryId];
  writePendingRecoveryMap(map);
}
