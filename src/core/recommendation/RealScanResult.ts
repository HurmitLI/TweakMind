import { mockScanResult } from "./RecommendationEngine";
import type { MockScanResult } from "./RecommendationResult";
import { OptimizationSdkRegistry } from "../sdk/OptimizationSdkRegistry";

export async function createRealScanResult(): Promise<MockScanResult> {
  const [windowsSearchState, gameModeState, coreIsolationState, deliveryOptimizationState] = await Promise.all([
    OptimizationSdkRegistry.detect("windows-search"),
    OptimizationSdkRegistry.detect("game-mode"),
    OptimizationSdkRegistry.detect("core-isolation"),
    OptimizationSdkRegistry.detect("delivery-optimization")
  ]);

  return {
    ...mockScanResult,
    windowsSearchStatus: windowsSearchState.currentState,
    gameModeStatus: gameModeState.currentState,
    coreIsolationStatus: coreIsolationState.currentState,
    deliveryOptimizationStatus: deliveryOptimizationState.currentState
  };
}
