import type { OptimizationId } from "../../types/optimization";
import type { OptimizationEngineResult } from "../engine/OptimizationEngine";
import { ScanCapabilityRegistry } from "./ScanCapabilityRegistry";
import {
  buildRuntimeScanSnapshot,
  formatRuntimeScanLabel,
  type RuntimeScanSnapshot
} from "./RuntimeScanModel";
import { readStoredScanResult, type OptimizationScanResult } from "./ScanResult";

export class RuntimeScanService {
  static getCapability(optimizationId: OptimizationId) {
    return ScanCapabilityRegistry.get(optimizationId);
  }

  static buildFromDetection(optimizationId: OptimizationId, detection: OptimizationEngineResult): RuntimeScanSnapshot {
    return buildRuntimeScanSnapshot(optimizationId, ScanCapabilityRegistry.get(optimizationId), detection);
  }

  static getStoredSnapshot(optimizationId: OptimizationId): RuntimeScanSnapshot | null {
    const scanResult = readStoredScanResult();
    const entry = scanResult?.optimizationResults.find((result) => result.id === optimizationId);

    if (!entry?.runtimeScan) {
      return null;
    }

    return entry.runtimeScan;
  }

  static getDisplayState(optimizationId: OptimizationId): string {
    const stored = this.getStoredSnapshot(optimizationId);

    if (stored) {
      return formatRuntimeScanLabel(stored);
    }

    const capability = ScanCapabilityRegistry.get(optimizationId);

    if (capability.scanCapability === "Not Supported Yet") {
      return "Not Supported Yet";
    }

    return "Scan Required";
  }

  static attachRuntimeScan(
    optimizationId: OptimizationId,
    detection: OptimizationEngineResult
  ): RuntimeScanSnapshot {
    return this.buildFromDetection(optimizationId, detection);
  }

  static readRuntimeFromResult(result: OptimizationScanResult): RuntimeScanSnapshot {
    if (result.runtimeScan) {
      return result.runtimeScan;
    }

    return buildRuntimeScanSnapshot(result.id, ScanCapabilityRegistry.get(result.id));
  }
}
