import { mockScanResult } from "./RecommendationEngine";
import type { MockScanResult } from "./RecommendationResult";
import { OptimizationEngineRegistry } from "../engine/OptimizationEngineRegistry";

export async function createRealScanResult(): Promise<MockScanResult> {
  const [windowsSearchState, gameModeState, coreIsolationState, deliveryOptimizationState] = await Promise.all([
    OptimizationEngineRegistry.get("windows-search").detect(),
    OptimizationEngineRegistry.get("game-mode").detect(),
    OptimizationEngineRegistry.get("core-isolation").detect(),
    OptimizationEngineRegistry.get("delivery-optimization").detect()
  ]);

  return {
    ...mockScanResult,
    windowsSearchStatus: windowsSearchState.currentState,
    gameModeStatus: gameModeState.currentState,
    coreIsolationStatus: coreIsolationState.currentState,
    deliveryOptimizationStatus: deliveryOptimizationState.currentState
  };
}
