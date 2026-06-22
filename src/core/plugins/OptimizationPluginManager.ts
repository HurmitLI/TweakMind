import type { OptimizationId } from "../../types/optimization";
import type {
  ApplyExecutionResult,
  RecoveryExecutionResult,
  VerificationExecutionResult
} from "../execution/OptimizationExecutionTypes";
import type { OptimizationEngineResult } from "../engine/OptimizationEngine";
import { OptimizationPluginRegistry } from "./OptimizationPluginRegistry";
import type {
  OptimizationPlugin,
  OptimizationPluginCapabilities,
  OptimizationPluginContext
} from "./OptimizationPluginTypes";

export class OptimizationPluginManager {
  static get(id: OptimizationId): OptimizationPlugin {
    return OptimizationPluginRegistry.get(id);
  }

  static getCapabilities(id: OptimizationId): OptimizationPluginCapabilities {
    return this.get(id).capabilities;
  }

  static scan(id: OptimizationId, context?: OptimizationPluginContext): Promise<OptimizationEngineResult> {
    return this.get(id).scan(context);
  }

  static apply(id: OptimizationId, context?: OptimizationPluginContext): Promise<ApplyExecutionResult> {
    return this.get(id).apply(context);
  }

  static verify(id: OptimizationId, context?: OptimizationPluginContext): Promise<VerificationExecutionResult> {
    return this.get(id).verify(context);
  }

  static recover(id: OptimizationId, context?: OptimizationPluginContext): Promise<RecoveryExecutionResult> {
    return this.get(id).recover(context);
  }
}
