import type { OptimizationEngine } from "../OptimizationEngine";
import type { OptimizationStatus } from "../../../types/optimization";
import { OptimizationSdkRegistry } from "../../sdk/OptimizationSdkRegistry";

export class DeliveryOptimizationEngine implements OptimizationEngine {
  id = "delivery-optimization" as const;

  async detect() {
    return OptimizationSdkRegistry.get(this.id).detector.detect();
  }

  async apply() {
    return OptimizationSdkRegistry.get(this.id).executor.apply();
  }

  async restore(previousState: OptimizationStatus = "Unknown") {
    return OptimizationSdkRegistry.get(this.id).recovery.restore(previousState);
  }
}
