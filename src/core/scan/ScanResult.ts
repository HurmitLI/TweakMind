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
  const localResult = readScanResultFromStorage(window.localStorage);
  const sessionResult = readScanResultFromStorage(window.sessionStorage);

  if (localResult && sessionResult) {
    return pickNewerScanResult(localResult, sessionResult);
  }

  return localResult ?? sessionResult;
}

export function storeScanResult(scanResult: ScanResult) {
  if (!isValidScanResult(scanResult)) {
    return;
  }

  const serialized = JSON.stringify(scanResult);
  window.sessionStorage.setItem(scanResultStorageKey, serialized);
  window.localStorage.setItem(scanResultStorageKey, serialized);
}

export function clearStoredScanResult() {
  window.sessionStorage.removeItem(scanResultStorageKey);
  window.localStorage.removeItem(scanResultStorageKey);
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
