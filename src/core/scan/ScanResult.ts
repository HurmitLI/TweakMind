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

export function readStoredScanResult(): ScanResult | null {
  try {
    const stored = window.sessionStorage.getItem(scanResultStorageKey);
    return stored ? (JSON.parse(stored) as ScanResult) : null;
  } catch {
    return null;
  }
}

export function storeScanResult(scanResult: ScanResult) {
  window.sessionStorage.setItem(scanResultStorageKey, JSON.stringify(scanResult));
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
