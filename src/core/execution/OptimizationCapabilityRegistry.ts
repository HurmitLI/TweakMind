import type { OptimizationId } from "../../types/optimization";
import type { OptimizationExecutionCapabilities } from "./OptimizationExecutionTypes";
import { OptimizationPluginManager } from "../plugins/OptimizationPluginManager";

export class OptimizationCapabilityRegistry {
  static get(id: OptimizationId): OptimizationExecutionCapabilities {
    return OptimizationPluginManager.getCapabilities(id);
  }

  static canRealApply(id: OptimizationId) {
    return this.get(id).canRealApply;
  }

  static canVerify(id: OptimizationId) {
    return this.get(id).canVerify;
  }

  static canRecover(id: OptimizationId) {
    return this.get(id).canRecover;
  }
}
