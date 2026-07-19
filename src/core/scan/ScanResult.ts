import type { OptimizationDefinition, OptimizationId, OptimizationRecommendation, OptimizationStatus } from "../../types/optimization";
import type { RecommendationResult } from "../recommendation/RecommendationResult";
import type { RuntimeScanSnapshot } from "./RuntimeScanModel";

export interface OptimizationScanResult {
  id: OptimizationId;
  definition: OptimizationDefinition;
  rawDetectedValue: OptimizationStatus;
  normalizedStatus: OptimizationStatus;
  recommendation: OptimizationRecommendation;
  reason: string;
  selectable: boolean;
  selectedByDefault: boolean;
  runtimeScan: RuntimeScanSnapshot;
}

export interface RecommendationSummary {
  total: number;
  selectable: number;
  selectedByDefault: number;
  alreadyOptimized: number;
  keepDefault: number;
  optional: number;
  recommended: number;
}

export interface ScanResult {
  timestamp: string;
  duration: number;
  optimizationResults: OptimizationScanResult[];
  recommendationSummary: RecommendationSummary;
  estimatedImpact: string;
  estimatedRisk: string;
  executionEstimate: string;
}

export const scanResultStorageKey = "tweakmind:scan-result";
const recommendationSummaryKeys: Array<keyof RecommendationSummary> = [
  "total",
  "selectable",
  "selectedByDefault",
  "alreadyOptimized",
  "keepDefault",
  "optional",
  "recommended"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidOptimizationScanResult(value: unknown): value is OptimizationScanResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isRecord(value.definition) &&
    typeof value.rawDetectedValue === "string" &&
    typeof value.normalizedStatus === "string" &&
    typeof value.recommendation === "string" &&
    typeof value.reason === "string" &&
    typeof value.selectable === "boolean" &&
    typeof value.selectedByDefault === "boolean" &&
    isRecord(value.runtimeScan)
  );
}

export function isValidScanResult(value: unknown): value is ScanResult {
  if (!isRecord(value)) {
    return false;
  }

  const recommendationSummary = value.recommendationSummary;

  if (
    typeof value.timestamp !== "string" ||
    typeof value.duration !== "number" ||
    !Array.isArray(value.optimizationResults) ||
    value.optimizationResults.length === 0 ||
    !isRecord(recommendationSummary) ||
    !recommendationSummaryKeys.every((key) => typeof recommendationSummary[key] === "number") ||
    typeof value.estimatedImpact !== "string" ||
    typeof value.estimatedRisk !== "string" ||
    typeof value.executionEstimate !== "string"
  ) {
    return false;
  }

  return value.optimizationResults.every(isValidOptimizationScanResult);
}

function readScanResultFromStorage(storage: Storage): ScanResult | null {
  try {
    const stored = storage.getItem(scanResultStorageKey);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as unknown;
    return isValidScanResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Normalizes scan result timestamps to Unix seconds for comparison.
 * Supports current Unix-second strings and legacy ISO date strings.
 * Returns null when the value cannot be parsed safely.
 */
export function parseScanResultTimestamp(timestamp: string): number | null {
  const trimmed = timestamp.trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed);

    if (!Number.isFinite(seconds) || seconds <= 0) {
      return null;
    }

    return seconds;
  }

  const parsedMilliseconds = Date.parse(trimmed);

  if (Number.isNaN(parsedMilliseconds)) {
    return null;
  }

  return Math.floor(parsedMilliseconds / 1000);
}

function pickNewerScanResult(localResult: ScanResult, sessionResult: ScanResult): ScanResult {
  const localTimestamp = parseScanResultTimestamp(localResult.timestamp);
  const sessionTimestamp = parseScanResultTimestamp(sessionResult.timestamp);

  if (localTimestamp === null && sessionTimestamp === null) {
    return localResult;
  }

  if (localTimestamp === null) {
    return sessionResult;
  }

  if (sessionTimestamp === null) {
    return localResult;
  }

  return sessionTimestamp > localTimestamp ? sessionResult : localResult;
}

export function readStoredScanResult(): ScanResult | null {
  // Each side is read independently; corrupt/missing copies degrade to the other.
  const localResult = readScanResultFromStorage(window.localStorage);
  const sessionResult = readScanResultFromStorage(window.sessionStorage);

  if (localResult && sessionResult) {
    return pickNewerScanResult(localResult, sessionResult);
  }

  return localResult ?? sessionResult;
}

function toStorageErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const asString = String(error ?? "").trim();
  return asString || "unknown storage error";
}

function writeScanResultToStorage(storage: Storage, serialized: string): { ok: true } | { ok: false; error: unknown } {
  try {
    storage.setItem(scanResultStorageKey, serialized);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

function removeScanResultFromStorage(storage: Storage): { ok: true } | { ok: false; error: unknown } {
  try {
    storage.removeItem(scanResultStorageKey);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * Persist to sessionStorage and localStorage independently.
 * Succeeds when at least one durable copy is written; throws only when both fail.
 */
export function storeScanResult(scanResult: ScanResult) {
  if (!isValidScanResult(scanResult)) {
    return;
  }

  const serialized = JSON.stringify(scanResult);
  const sessionWrite = writeScanResultToStorage(window.sessionStorage, serialized);
  const localWrite = writeScanResultToStorage(window.localStorage, serialized);

  if (sessionWrite.ok || localWrite.ok) {
    return;
  }

  throw new Error(
    `Failed to persist scan result to sessionStorage (${toStorageErrorMessage(sessionWrite.error)}) and localStorage (${toStorageErrorMessage(localWrite.error)}).`
  );
}

/**
 * Clear both storages independently so a failure on one side cannot leave the other uncleared.
 */
export function clearStoredScanResult() {
  removeScanResultFromStorage(window.sessionStorage);
  removeScanResultFromStorage(window.localStorage);
}

export function toRecommendationResult(result: OptimizationScanResult): RecommendationResult {
  return {
    id: result.id,
    recommendation: result.recommendation,
    reason: result.reason,
    currentStatus: result.normalizedStatus,
    selectable: result.selectable,
    selectedByDefault: result.selectedByDefault
  };
}
