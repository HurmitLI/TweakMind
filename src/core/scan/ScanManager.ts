import { OptimizationSdkRegistry } from "../sdk/OptimizationSdkRegistry";
import { normalizeOptimizationStatus } from "../sdk/OptimizationSdk";
import type { MockDeviceType } from "../recommendation/RecommendationResult";
import { OptimizationPluginManager } from "../plugins/OptimizationPluginManager";
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
      const detectionResult = await OptimizationPluginManager.scan(module.definition.id, {
        scan: () => module.detector.detect()
      });
      const normalizedStatus = normalizeOptimizationStatus(detectionResult.currentState);
      const evaluation = module.evaluator.evaluate({
        definition: module.definition,
        detectedStatus: normalizedStatus,
        deviceType
      });

      optimizationResults.push({
        id: module.definition.id,
        definition: module.definition,
        rawDetectedValue: detectionResult.currentState,
        normalizedStatus,
        recommendation: evaluation.recommendation,
        reason: evaluation.reason,
        selectable: evaluation.selectable,
        selectedByDefault: evaluation.selectedByDefault
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
      estimatedImpact: "Medium",
      estimatedRisk: "Low",
      executionEstimate: "3 min"
    };

    storeScanResult(scanResult);

    return scanResult;
  }
}
