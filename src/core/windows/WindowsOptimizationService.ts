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

function readMergedPendingApplyMapFromStorage(): PendingApplyMap {
  const localMap = readPendingApplyMapFromStorage(window.localStorage);
  const sessionMap = readPendingApplyMapFromStorage(window.sessionStorage);

  // Session wins per optimization id when both copies exist.
  return { ...localMap, ...sessionMap };
}

/**
 * In-process authoritative pending-apply map after a successful store/clear.
 * `null` means "no runtime authority yet — read from dual storage".
 * An empty object means "intentionally empty" and suppresses stale storage
 * leftovers that failed to rewrite/remove on one or both sides.
 */
let runtimePendingApplySnapshot: PendingApplyMap | null = null;

function clonePendingApplyMap(map: PendingApplyMap): PendingApplyMap {
  return { ...map };
}

/**
 * Prefer the runtime snapshot whenever this process has successfully stored or
 * cleared pending apply state, so a failed-side stale copy cannot override a
 * newer one-sided durable write via session-over-local merge.
 */
function getAuthoritativePendingApplyMap(): PendingApplyMap {
  if (runtimePendingApplySnapshot !== null) {
    return clonePendingApplyMap(runtimePendingApplySnapshot);
  }

  return readMergedPendingApplyMapFromStorage();
}

/** Test-only: drop the in-process pending-apply snapshot between cases. */
export function resetPendingApplyRuntimeForTests(): void {
  runtimePendingApplySnapshot = null;
}

function toPendingStorageErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const asString = String(error ?? "").trim();
  return asString || "unknown storage error";
}

function writePendingApplyValueToStorage(
  storage: Storage,
  serialized: string
): { ok: true } | { ok: false; error: unknown } {
  try {
    storage.setItem(pendingApplyResultStorageKey, serialized);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

function removePendingApplyValueFromStorage(storage: Storage): void {
  try {
    storage.removeItem(pendingApplyResultStorageKey);
  } catch {
    // Best-effort: continue clearing/writing the other storage.
  }
}

/**
 * Persist the keyed pending-apply map to sessionStorage and localStorage
 * independently. Succeeds when at least one durable copy is written.
 * On one-sided success, best-effort remove the failed side so a stale copy
 * cannot resurrect via merge after restart when remove is allowed.
 */
function writePendingApplyMap(map: PendingApplyMap) {
  if (Object.keys(map).length === 0) {
    removePendingApplyValueFromStorage(window.sessionStorage);
    removePendingApplyValueFromStorage(window.localStorage);
    return;
  }

  const serialized = JSON.stringify(map);
  const sessionWrite = writePendingApplyValueToStorage(window.sessionStorage, serialized);
  const localWrite = writePendingApplyValueToStorage(window.localStorage, serialized);

  if (sessionWrite.ok || localWrite.ok) {
    if (!sessionWrite.ok) {
      removePendingApplyValueFromStorage(window.sessionStorage);
    }

    if (!localWrite.ok) {
      removePendingApplyValueFromStorage(window.localStorage);
    }

    return;
  }

  throw new Error(
    `Failed to persist pending apply result to sessionStorage (${toPendingStorageErrorMessage(sessionWrite.error)}) and localStorage (${toPendingStorageErrorMessage(localWrite.error)}).`
  );
}

export function storePendingApplyResult(result: OptimizationApplyResult) {
  const map = getAuthoritativePendingApplyMap();
  map[result.optimizationId] = result;
  writePendingApplyMap(map);
  // Only after at least one durable copy succeeds — never promote an unpersisted map.
  runtimePendingApplySnapshot = clonePendingApplyMap(map);
}

export function readPendingApplyResult(optimizationId: OptimizationId): OptimizationApplyResult | null {
  const result = getAuthoritativePendingApplyMap()[optimizationId];

  if (!result || result.optimizationId !== optimizationId) {
    return null;
  }

  return result;
}

function clearPendingApplySlotFromStorage(storage: Storage, optimizationId: OptimizationId): void {
  try {
    const map = readPendingApplyMapFromStorage(storage);

    if (!(optimizationId in map)) {
      return;
    }

    delete map[optimizationId];

    if (Object.keys(map).length === 0) {
      removePendingApplyValueFromStorage(storage);
      return;
    }

    const write = writePendingApplyValueToStorage(storage, JSON.stringify(map));

    if (!write.ok) {
      // Stale per-storage copies must not resurrect a cleared slot via merge.
      removePendingApplyValueFromStorage(storage);
    }
  } catch {
    removePendingApplyValueFromStorage(storage);
  }
}

export function clearPendingApplyResult(optimizationId?: OptimizationId) {
  if (!optimizationId) {
    removePendingApplyValueFromStorage(window.sessionStorage);
    removePendingApplyValueFromStorage(window.localStorage);
    // Empty snapshot suppresses uncleared leftovers when removeItem fails.
    runtimePendingApplySnapshot = {};
    return;
  }

  const map = getAuthoritativePendingApplyMap();
  delete map[optimizationId];

  // Clear each storage independently so one-sided rewrite/remove failures cannot
  // skip the other side. Runtime snapshot still hides the slot if both fail.
  clearPendingApplySlotFromStorage(window.sessionStorage, optimizationId);
  clearPendingApplySlotFromStorage(window.localStorage, optimizationId);
  runtimePendingApplySnapshot = clonePendingApplyMap(map);
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

function readMergedPendingRecoveryMapFromStorage(): PendingRecoveryMap {
  const localMap = readPendingRecoveryMapFromStorage(window.localStorage);
  const sessionMap = readPendingRecoveryMapFromStorage(window.sessionStorage);

  // Session wins per history entry id when both copies exist.
  return { ...localMap, ...sessionMap };
}

/**
 * In-process authoritative pending-recovery map after a successful store/clear.
 * Mirrors pending-apply: `null` reads dual storage; `{}` suppresses leftovers
 * when rewrite/remove failed on one or both sides.
 */
let runtimePendingRecoverySnapshot: PendingRecoveryMap | null = null;

function clonePendingRecoveryMap(map: PendingRecoveryMap): PendingRecoveryMap {
  return { ...map };
}

function getAuthoritativePendingRecoveryMap(): PendingRecoveryMap {
  if (runtimePendingRecoverySnapshot !== null) {
    return clonePendingRecoveryMap(runtimePendingRecoverySnapshot);
  }

  return readMergedPendingRecoveryMapFromStorage();
}

/** Test-only: drop the in-process pending-recovery snapshot between cases. */
export function resetPendingRecoveryRuntimeForTests(): void {
  runtimePendingRecoverySnapshot = null;
}

function writePendingRecoveryValueToStorage(
  storage: Storage,
  serialized: string
): { ok: true } | { ok: false; error: unknown } {
  try {
    storage.setItem(pendingRecoveryResultStorageKey, serialized);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

function removePendingRecoveryValueFromStorage(storage: Storage): void {
  try {
    storage.removeItem(pendingRecoveryResultStorageKey);
  } catch {
    // Best-effort: continue clearing/writing the other storage.
  }
}

/**
 * Persist the keyed pending-recovery map to sessionStorage and localStorage
 * independently. Succeeds when at least one durable copy is written.
 */
function writePendingRecoveryMap(map: PendingRecoveryMap) {
  if (Object.keys(map).length === 0) {
    removePendingRecoveryValueFromStorage(window.sessionStorage);
    removePendingRecoveryValueFromStorage(window.localStorage);
    return;
  }

  const serialized = JSON.stringify(map);
  const sessionWrite = writePendingRecoveryValueToStorage(window.sessionStorage, serialized);
  const localWrite = writePendingRecoveryValueToStorage(window.localStorage, serialized);

  if (sessionWrite.ok || localWrite.ok) {
    if (!sessionWrite.ok) {
      removePendingRecoveryValueFromStorage(window.sessionStorage);
    }

    if (!localWrite.ok) {
      removePendingRecoveryValueFromStorage(window.localStorage);
    }

    return;
  }

  throw new Error(
    `Failed to persist pending recovery result to sessionStorage (${toPendingStorageErrorMessage(sessionWrite.error)}) and localStorage (${toPendingStorageErrorMessage(localWrite.error)}).`
  );
}

export function storePendingRecoveryResult(result: OptimizationRecoveryResult) {
  const map = getAuthoritativePendingRecoveryMap();
  map[result.historyEntryId] = result;
  writePendingRecoveryMap(map);
  // Only after at least one durable copy succeeds — never promote an unpersisted map.
  runtimePendingRecoverySnapshot = clonePendingRecoveryMap(map);
}

export function readPendingRecoveryResult(historyEntryId: string): OptimizationRecoveryResult | null {
  const result = getAuthoritativePendingRecoveryMap()[historyEntryId];

  if (!result || result.historyEntryId !== historyEntryId) {
    return null;
  }

  return result;
}

/**
 * Runtime tombstones for recovery authorizations that were matched and consumed
 * in this JS session. In-memory only — never persisted to localStorage — so a
 * failed sessionStorage.removeItem cannot allow the same confirmation to replay
 * after the restore lifecycle settles. App restart clears this Set naturally.
 */
const consumedRecoveryAuthorizationIds = new Set<string>();

type PendingRecoveryAuthMap = Record<string, true>;

/**
 * Read the keyed one-session authorization map from sessionStorage.
 * Migrates legacy single-string payloads (`"entry-1"`) into a one-key map.
 */
function readPendingRecoveryAuthMap(): PendingRecoveryAuthMap {
  try {
    const stored = window.sessionStorage.getItem(pendingRecoveryAuthorizationStorageKey);

    if (!stored) {
      return {};
    }

    // Legacy single-slot payload from older builds: bare historyEntryId string.
    if (!stored.startsWith("{") && !stored.startsWith("[")) {
      const legacyId = stored.trim();
      return legacyId ? { [legacyId]: true } : {};
    }

    const parsed = JSON.parse(stored) as unknown;

    if (typeof parsed === "string") {
      const legacyId = parsed.trim();
      return legacyId ? { [legacyId]: true } : {};
    }

    if (!isRecord(parsed)) {
      return {};
    }

    const map: PendingRecoveryAuthMap = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (!key.trim()) {
        continue;
      }

      // Accept `{ "entry-1": true }` and tolerate accidental self-keyed copies.
      if (value === true || value === key) {
        map[key] = true;
      }
    }

    return map;
  } catch {
    return {};
  }
}

function writePendingRecoveryAuthMap(map: PendingRecoveryAuthMap): void {
  if (Object.keys(map).length === 0) {
    window.sessionStorage.removeItem(pendingRecoveryAuthorizationStorageKey);
    return;
  }

  window.sessionStorage.setItem(pendingRecoveryAuthorizationStorageKey, JSON.stringify(map));
}

function removeLegacyLocalRecoveryAuthorization(): void {
  try {
    window.localStorage.removeItem(pendingRecoveryAuthorizationStorageKey);
  } catch {
    // Best-effort legacy cleanup only.
  }
}

/** Test-only: drop runtime consumed marks between cases. */
export function resetConsumedRecoveryAuthorizationForTests(): void {
  consumedRecoveryAuthorizationIds.clear();
}

export function storePendingRecoveryAuthorization(historyEntryId: string) {
  if (!historyEntryId.trim()) {
    throw new Error("Missing history entry id for recovery authorization.");
  }

  // Authorization is a one-session confirm gate keyed by historyEntryId.
  // Persisting it in localStorage would let /recovery?historyId=… auto-run
  // after an app restart without a fresh confirmation click.
  const map = readPendingRecoveryAuthMap();
  map[historyEntryId] = true;
  writePendingRecoveryAuthMap(map);

  // A fresh confirmation successfully rewritten for this id may be used again.
  consumedRecoveryAuthorizationIds.delete(historyEntryId);

  removeLegacyLocalRecoveryAuthorization();
}

export function hasPendingRecoveryAuthorization(historyEntryId: string) {
  // Drop any legacy durable authorization left by older builds.
  // Best-effort only: privacy/storage policies that reject removeItem must not
  // block reading a valid one-session authorization from sessionStorage.
  removeLegacyLocalRecoveryAuthorization();

  if (!historyEntryId.trim() || consumedRecoveryAuthorizationIds.has(historyEntryId)) {
    return false;
  }

  return historyEntryId in readPendingRecoveryAuthMap();
}

/**
 * Precisely consume a one-session recovery authorization for historyEntryId.
 * On match: mark runtime-consumed first, then best-effort rewrite/remove the
 * keyed session map (and legacy local). Never throws. Returns true when the
 * matching authorization was accepted for consume (including when physical
 * storage mutation fails).
 */
export function consumePendingRecoveryAuthorization(historyEntryId: string): boolean {
  if (!historyEntryId.trim() || consumedRecoveryAuthorizationIds.has(historyEntryId)) {
    return false;
  }

  removeLegacyLocalRecoveryAuthorization();

  try {
    const map = readPendingRecoveryAuthMap();

    if (!(historyEntryId in map)) {
      return false;
    }

    // Tombstone before rewrite/remove so a persistent storage failure cannot replay.
    consumedRecoveryAuthorizationIds.add(historyEntryId);
    delete map[historyEntryId];

    try {
      writePendingRecoveryAuthMap(map);
    } catch {
      // Physical rewrite failed; runtime tombstone still blocks replay for this id.
      // Other history ids remain authorized via the leftover map when readable.
    }

    return true;
  } catch {
    // Could not confirm a match; do not tombstone an unverified id.
    return false;
  }
}

export function clearPendingRecoveryAuthorization() {
  try {
    window.sessionStorage.removeItem(pendingRecoveryAuthorizationStorageKey);
  } catch {
    // Best-effort: continue clearing the other storage.
  }

  removeLegacyLocalRecoveryAuthorization();
}

function clearPendingRecoverySlotFromStorage(storage: Storage, historyEntryId: string): void {
  try {
    const map = readPendingRecoveryMapFromStorage(storage);

    if (!(historyEntryId in map)) {
      return;
    }

    delete map[historyEntryId];

    if (Object.keys(map).length === 0) {
      removePendingRecoveryValueFromStorage(storage);
      return;
    }

    const write = writePendingRecoveryValueToStorage(storage, JSON.stringify(map));

    if (!write.ok) {
      // Stale per-storage copies must not resurrect a cleared slot via merge.
      removePendingRecoveryValueFromStorage(storage);
    }
  } catch {
    removePendingRecoveryValueFromStorage(storage);
  }
}

export function clearPendingRecoveryResult(historyEntryId?: string) {
  if (!historyEntryId) {
    removePendingRecoveryValueFromStorage(window.sessionStorage);
    removePendingRecoveryValueFromStorage(window.localStorage);
    runtimePendingRecoverySnapshot = {};
    return;
  }

  const map = getAuthoritativePendingRecoveryMap();
  delete map[historyEntryId];

  // Clear each storage independently so one-sided rewrite/remove failures cannot
  // skip the other side. Runtime snapshot still hides the slot if both fail.
  clearPendingRecoverySlotFromStorage(window.sessionStorage, historyEntryId);
  clearPendingRecoverySlotFromStorage(window.localStorage, historyEntryId);
  runtimePendingRecoverySnapshot = clonePendingRecoveryMap(map);
}
