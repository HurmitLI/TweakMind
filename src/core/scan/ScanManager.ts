import { OptimizationSdkRegistry } from "../sdk/OptimizationSdkRegistry";
import { normalizeOptimizationStatus } from "../sdk/OptimizationSdk";
import type { MockDeviceType } from "../recommendation/RecommendationResult";
import { OptimizationPluginManager } from "../plugins/OptimizationPluginManager";
import { createEngineResult, type OptimizationEngineResult } from "../engine/OptimizationEngine";
import type { OptimizationEvaluation } from "../sdk/OptimizationSdk";
import { RuntimeScanService } from "./RuntimeScanService";
import type { OptimizationScanResult, RecommendationSummary, ScanResult } from "./ScanResult";
import { storeScanResult } from "./ScanResult";

export interface ScanProgress {
  completed: number;
  total: number;
  progress: number;
  currentOptimization?: string;
  duration: number;
}

export interface ScanManagerOptions {
  deviceType?: MockDeviceType;
  onProgress?: (progress: ScanProgress) => void;
}

function buildRecommendationSummary(results: OptimizationScanResult[]): RecommendationSummary {
  return {
    total: results.length,
    selectable: results.filter((result) => result.selectable).length,
    selectedByDefault: results.filter((result) => result.selectedByDefault).length,
    alreadyOptimized: results.filter((result) => result.recommendation === "Already Optimized").length,
    keepDefault: results.filter((result) => result.recommendation === "Keep Default").length,
    optional: results.filter((result) => result.recommendation === "Optional").length,
    recommended: results.filter((result) => result.recommendation === "Recommended").length
  };
}

function createIsolatedScanFailure(title: string, error: unknown): OptimizationEngineResult {
  console.warn(`[TweakMind] Scan failed for ${title}.`, error);

  return createEngineResult({
    status: "Failed",
    success: false,
    previousState: "Unknown",
    currentState: "Unknown",
    message:
      "Scan failed for this optimization. Unable to determine the current Windows state. Please retry scanning or check permissions."
  });
}

export class ScanManager {
  static async run(options: ScanManagerOptions = {}): Promise<ScanResult> {
    const deviceType = options.deviceType ?? "Gaming PC";
    const startedAt = Date.now();
    const modules = OptimizationSdkRegistry.getAll();
    const optimizationResults: OptimizationScanResult[] = [];

    options.onProgress?.({
      completed: 0,
      total: modules.length,
      progress: 0,
      duration: 0
    });

    for (const module of modules) {
      let detectionResult: OptimizationEngineResult;

      try {
        detectionResult = await OptimizationPluginManager.scan(module.definition.id, {
          scan: () => module.detector.detect()
        });
      } catch (error) {
        detectionResult = createIsolatedScanFailure(module.definition.title, error);
      }

      const normalizedStatus = normalizeOptimizationStatus(detectionResult.currentState);
      let evaluation: OptimizationEvaluation;

      try {
        evaluation = module.evaluator.evaluate({
          definition: module.definition,
          detectedStatus: normalizedStatus,
          deviceType
        });
      } catch (error) {
        console.warn(`[TweakMind] Scan evaluation failed for ${module.definition.title}.`, error);
        evaluation = {
          recommendation: "Optional" as const,
          reason:
            "Unable to determine the current Windows state. Please retry scanning or check permissions.",
          selectable: false,
          selectedByDefault: false,
          currentStatus: "Unknown" as const
        };
      }
      const canSelectSafely = detectionResult.success && normalizedStatus !== "Unknown";

      optimizationResults.push({
        id: module.definition.id,
        definition: module.definition,
        rawDetectedValue: detectionResult.currentState,
        normalizedStatus,
        recommendation: evaluation.recommendation,
        reason: detectionResult.success
          ? evaluation.reason
          : "Unable to determine the current Windows state. Please retry scanning or check permissions.",
        selectable: canSelectSafely && evaluation.selectable,
        selectedByDefault: canSelectSafely && evaluation.selectedByDefault,
        runtimeScan: RuntimeScanService.buildFromDetection(module.definition.id, detectionResult)
      });

      options.onProgress?.({
        completed: optimizationResults.length,
        total: modules.length,
        progress: Math.round((optimizationResults.length / modules.length) * 100),
        currentOptimization: module.definition.title,
        duration: Date.now() - startedAt
      });
    }

    const scanResult: ScanResult = {
      timestamp: Math.floor(startedAt / 1000).toString(),
      duration: Date.now() - startedAt,
      optimizationResults,
      recommendationSummary: buildRecommendationSummary(optimizationResults),
      // Hero metrics are derived from DecisionReport items; do not persist placeholders.
      estimatedImpact: "Unknown",
      estimatedRisk: "Unknown",
      executionEstimate: "Unknown"
    };

    storeScanResult(scanResult);

    return scanResult;
  }
}
