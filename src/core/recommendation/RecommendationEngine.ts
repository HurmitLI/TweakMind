import type { MockScanResult, RecommendationResult } from "./RecommendationResult";
import type { OptimizationId, OptimizationRecommendation, OptimizationStatus } from "../../types/optimization";
import { OptimizationSdkRegistry } from "../sdk/OptimizationSdkRegistry";

export const mockScanResult: MockScanResult = {
  windowsSearchStatus: "Unknown",
  gameModeStatus: "Unknown",
  coreIsolationStatus: "Unknown",
  deliveryOptimizationStatus: "Unknown",
  deviceType: "Gaming PC"
};

export const recommendationResultsStorageKey = "tweakmind:recommendation-results";

function normalizeStatus(status: OptimizationStatus): OptimizationStatus {
  return status || "Unknown";
}

function logRecommendationMapping(
  id: OptimizationId,
  rawDetectedValue: OptimizationStatus,
  normalizedStatus: OptimizationStatus,
  recommendation: OptimizationRecommendation
) {
  console.info(`[TweakMind Detection] ${id}: raw=${rawDetectedValue}; normalized=${normalizedStatus}; recommendation=${recommendation}`);
}

export class RecommendationEngine {
  static generate(scanResult: MockScanResult): RecommendationResult[] {
    const windowsSearchRecommendation = this.recommendWindowsSearch(scanResult);
    const gameModeRecommendation = this.recommendGameMode(scanResult);
    const coreIsolationRecommendation = this.recommendCoreIsolation(scanResult);
    const deliveryOptimizationRecommendation = this.toRecommendationResult(
      "delivery-optimization",
      scanResult.deliveryOptimizationStatus,
      scanResult.deviceType
    );

    logRecommendationMapping(
      "delivery-optimization",
      scanResult.deliveryOptimizationStatus,
      deliveryOptimizationRecommendation.currentStatus ?? "Unknown",
      deliveryOptimizationRecommendation.recommendation
    );

    return [
      windowsSearchRecommendation,
      gameModeRecommendation,
      coreIsolationRecommendation,
      deliveryOptimizationRecommendation
    ];
  }

  private static recommendWindowsSearch(scanResult: MockScanResult): RecommendationResult {
    const result = this.toRecommendationResult("windows-search", scanResult.windowsSearchStatus, scanResult.deviceType);

    logRecommendationMapping("windows-search", scanResult.windowsSearchStatus, result.currentStatus ?? "Unknown", result.recommendation);

    return result;
  }

  private static recommendGameMode(scanResult: MockScanResult): RecommendationResult {
    const result = this.toRecommendationResult("game-mode", scanResult.gameModeStatus, scanResult.deviceType);

    logRecommendationMapping("game-mode", scanResult.gameModeStatus, result.currentStatus ?? "Unknown", result.recommendation);

    return result;
  }

  private static recommendCoreIsolation(scanResult: MockScanResult): RecommendationResult {
    const result = this.toRecommendationResult("core-isolation", scanResult.coreIsolationStatus, scanResult.deviceType);

    logRecommendationMapping("core-isolation", scanResult.coreIsolationStatus, result.currentStatus ?? "Unknown", result.recommendation);

    return result;
  }

  private static toRecommendationResult(id: OptimizationId, status: OptimizationStatus, deviceType: MockScanResult["deviceType"]): RecommendationResult {
    const evaluation = OptimizationSdkRegistry.evaluate(id, normalizeStatus(status), deviceType);

    return {
      id,
      recommendation: evaluation.recommendation,
      reason: evaluation.reason,
      currentStatus: evaluation.currentStatus,
      selectable: evaluation.selectable,
      selectedByDefault: evaluation.selectedByDefault
    };
  }
}
