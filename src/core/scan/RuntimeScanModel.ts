import type { OptimizationId, OptimizationStatus } from "../../types/optimization";
import type { OptimizationEngineResult } from "../engine/OptimizationEngine";
import type { ScanCapabilityDefinition } from "./ScanCapabilityRegistry";

export type RuntimeScanStatus = "Detected" | "Unknown" | "Not Supported Yet";

export type DetectionConfidence = "High" | "Medium" | "Low" | "None";

export interface RuntimeScanSnapshot {
  optimizationId: OptimizationId;
  runtimeScanStatus: RuntimeScanStatus;
  scanCapability: ScanCapabilityDefinition["scanCapability"];
  detectionMethod: string;
  currentRuntimeState: OptimizationStatus;
  detectionConfidence: DetectionConfidence;
  unavailableReason?: string;
  message: string;
  detectedAt?: string;
}

export function buildRuntimeScanSnapshot(
  optimizationId: OptimizationId,
  capability: ScanCapabilityDefinition,
  detection?: OptimizationEngineResult
): RuntimeScanSnapshot {
  if (capability.scanCapability === "Not Supported Yet") {
    return {
      optimizationId,
      runtimeScanStatus: "Not Supported Yet",
      scanCapability: capability.scanCapability,
      detectionMethod: capability.detectionMethod,
      currentRuntimeState: "Unknown",
      detectionConfidence: "None",
      unavailableReason: capability.unavailableReason,
      message: capability.unavailableReason ?? `${capability.title} scan is not supported yet.`
    };
  }

  if (!detection) {
    return {
      optimizationId,
      runtimeScanStatus: "Unknown",
      scanCapability: capability.scanCapability,
      detectionMethod: capability.detectionMethod,
      currentRuntimeState: "Unknown",
      detectionConfidence: "None",
      unavailableReason: "No scan has been run for this optimization yet.",
      message: "No scan has been run for this optimization yet."
    };
  }

  if (!detection.success) {
    return {
      optimizationId,
      runtimeScanStatus: "Unknown",
      scanCapability: capability.scanCapability,
      detectionMethod: capability.detectionMethod,
      currentRuntimeState: "Unknown",
      detectionConfidence: "None",
      unavailableReason: detection.message,
      message: detection.message,
      detectedAt: detection.timestamp
    };
  }

  if (detection.currentState === "Unknown") {
    return {
      optimizationId,
      runtimeScanStatus: "Unknown",
      scanCapability: capability.scanCapability,
      detectionMethod: capability.detectionMethod,
      currentRuntimeState: "Unknown",
      detectionConfidence: capability.detectionConfidenceWhenDetected,
      unavailableReason: detection.message,
      message: detection.message,
      detectedAt: detection.timestamp
    };
  }

  return {
    optimizationId,
    runtimeScanStatus: "Detected",
    scanCapability: capability.scanCapability,
    detectionMethod: capability.detectionMethod,
    currentRuntimeState: detection.currentState,
    detectionConfidence: capability.detectionConfidenceWhenDetected,
    message: detection.message,
    detectedAt: detection.timestamp
  };
}

export function formatRuntimeScanLabel(snapshot: RuntimeScanSnapshot): string {
  if (snapshot.runtimeScanStatus === "Detected") {
    return snapshot.currentRuntimeState;
  }

  return snapshot.runtimeScanStatus;
}
