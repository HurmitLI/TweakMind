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

function getScanResultTimestamp(scanResult: ScanResult): number {
  const timestamp = Date.parse(scanResult.timestamp);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function readStoredScanResult(): ScanResult | null {
  const localResult = readScanResultFromStorage(window.localStorage);
  const sessionResult = readScanResultFromStorage(window.sessionStorage);

  if (localResult && sessionResult) {
    return getScanResultTimestamp(sessionResult) > getScanResultTimestamp(localResult) ? sessionResult : localResult;
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
