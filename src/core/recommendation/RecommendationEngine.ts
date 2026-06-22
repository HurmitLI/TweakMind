import { OptimizationRepository } from "../optimization/OptimizationRepository";
import type { MockScanResult, RecommendationResult } from "./RecommendationResult";
import type { OptimizationId, OptimizationRecommendation, OptimizationStatus } from "../../types/optimization";

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
    const deliveryOptimizationStatus = normalizeStatus(scanResult.deliveryOptimizationStatus);
    const deliveryOptimizationRecommendation: RecommendationResult = {
      id: "delivery-optimization",
      recommendation: scanResult.deviceType === "Desktop" ? "Optional" : "Optional",
      reason: this.descriptionFor("delivery-optimization"),
      currentStatus: deliveryOptimizationStatus
    };

    logRecommendationMapping(
      "delivery-optimization",
      scanResult.deliveryOptimizationStatus,
      deliveryOptimizationStatus,
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
    const reason = this.descriptionFor("windows-search");
    const normalizedStatus = normalizeStatus(scanResult.windowsSearchStatus);
    let result: RecommendationResult;

    if (normalizedStatus === "Disabled") {
      result = {
        id: "windows-search",
        recommendation: "Already Optimized",
        reason,
        currentStatus: normalizedStatus
      };
    } else if (normalizedStatus === "Enabled" || normalizedStatus === "Running" || normalizedStatus === "Stopped") {
      result = {
        id: "windows-search",
        recommendation: "Recommended",
        reason,
        currentStatus: normalizedStatus
      };
    } else {
      result = {
        id: "windows-search",
        recommendation: "Optional",
        reason,
        currentStatus: "Unknown"
      };
    }

    logRecommendationMapping("windows-search", scanResult.windowsSearchStatus, result.currentStatus ?? "Unknown", result.recommendation);

    return result;
  }

  private static recommendGameMode(scanResult: MockScanResult): RecommendationResult {
    const reason = this.descriptionFor("game-mode");
    const normalizedStatus = normalizeStatus(scanResult.gameModeStatus);
    let result: RecommendationResult;

    if (normalizedStatus === "Enabled") {
      result = {
        id: "game-mode",
        recommendation: "Keep Enabled",
        reason,
        currentStatus: normalizedStatus
      };
    } else if (normalizedStatus === "Disabled") {
      result = {
        id: "game-mode",
        recommendation: "Recommended",
        reason,
        currentStatus: normalizedStatus
      };
    } else {
      result = {
        id: "game-mode",
        recommendation: "Optional",
        reason,
        currentStatus: "Unknown"
      };
    }

    logRecommendationMapping("game-mode", scanResult.gameModeStatus, result.currentStatus ?? "Unknown", result.recommendation);

    return result;
  }

  private static recommendCoreIsolation(scanResult: MockScanResult): RecommendationResult {
    const reason = this.descriptionFor("core-isolation");
    const normalizedStatus = normalizeStatus(scanResult.coreIsolationStatus);
    let result: RecommendationResult;

    if (normalizedStatus === "Enabled") {
      result = {
        id: "core-isolation",
        recommendation: "Keep Default",
        reason,
        currentStatus: normalizedStatus
      };
    } else if (normalizedStatus === "Disabled") {
      result = {
        id: "core-isolation",
        recommendation: "Optional",
        reason,
        currentStatus: normalizedStatus
      };
    } else {
      result = {
        id: "core-isolation",
        recommendation: "Optional",
        reason,
        currentStatus: "Unknown"
      };
    }

    logRecommendationMapping("core-isolation", scanResult.coreIsolationStatus, result.currentStatus ?? "Unknown", result.recommendation);

    return result;
  }

  private static descriptionFor(id: OptimizationId): string {
    return OptimizationRepository.getById(id)?.description ?? "";
  }
}
