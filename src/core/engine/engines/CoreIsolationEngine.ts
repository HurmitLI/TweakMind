import { OptimizationRepository } from "../../optimization/OptimizationRepository";
import type { OptimizationEngine } from "../OptimizationEngine";
import { createEngineResult } from "../OptimizationEngine";
import type { OptimizationStatus } from "../../../types/optimization";
import { detectWithNativeCommand } from "../NativeDetection";

export class CoreIsolationEngine implements OptimizationEngine {
  id = "core-isolation" as const;

  async detect() {
    return detectWithNativeCommand("detect_core_isolation", OptimizationRepository.getById(this.id)?.title ?? "Core Isolation");
  }

  async apply() {
    return createEngineResult({
      status: "Success",
      previousState: "Enabled",
      currentState: "Enabled",
      message: `${OptimizationRepository.getById(this.id)?.title ?? "Core Isolation"} mock apply recorded. No Windows changes were made.`
    });
  }

  async restore(previousState: OptimizationStatus = "Enabled") {
    return createEngineResult({
      status: "Success",
      previousState: "Enabled",
      currentState: previousState,
      message: `${OptimizationRepository.getById(this.id)?.title ?? "Core Isolation"} mock restore recorded. No Windows changes were made.`
    });
  }
}
