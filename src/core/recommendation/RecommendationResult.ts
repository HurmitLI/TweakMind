import type { OptimizationId, OptimizationRecommendation, OptimizationStatus } from "../../types/optimization";

export type MockDeviceType = "Gaming PC" | "Desktop" | "Laptop";

export interface MockScanResult {
  windowsSearchStatus: OptimizationStatus;
  gameModeStatus: OptimizationStatus;
  coreIsolationStatus: OptimizationStatus;
  deliveryOptimizationStatus: OptimizationStatus;
  deviceType: MockDeviceType;
}

export interface RecommendationResult {
  id: OptimizationId;
  recommendation: OptimizationRecommendation;
  reason: string;
  currentStatus?: OptimizationStatus;
}
