import { OptimizationRepository } from "../../optimization/OptimizationRepository";
import type { OptimizationEngine } from "../OptimizationEngine";
import { createEngineResult } from "../OptimizationEngine";
import type { OptimizationStatus } from "../../../types/optimization";
import { detectWithNativeCommand } from "../NativeDetection";

export class DeliveryOptimizationEngine implements OptimizationEngine {
  id = "delivery-optimization" as const;

  async detect() {
    return detectWithNativeCommand("detect_delivery_optimization", OptimizationRepository.getById(this.id)?.title ?? "Delivery Optimization");
  }

  async apply() {
    return createEngineResult({
      status: "Success",
      previousState: "Unknown",
      currentState: "Unknown",
      message: `${OptimizationRepository.getById(this.id)?.title ?? "Delivery Optimization"} mock apply recorded. No Windows changes were made.`
    });
  }

  async restore(previousState: OptimizationStatus = "Unknown") {
    return createEngineResult({
      status: "Success",
      previousState: "Unknown",
      currentState: previousState,
      message: `${OptimizationRepository.getById(this.id)?.title ?? "Delivery Optimization"} mock restore recorded. No Windows changes were made.`
    });
  }
}
