import type { OptimizationId, OptimizationStatus } from "../../types/optimization";
import type { MockDeviceType } from "../recommendation/RecommendationResult";
import type { OptimizationEngineResult } from "../engine/OptimizationEngine";
import type { OptimizationSdkModule, OptimizationSdkOutput } from "./OptimizationSdk";
import { normalizeOptimizationStatus } from "./OptimizationSdk";
import { optimizationSdkModules } from "./optimizations";

const modules = new Map<OptimizationId, OptimizationSdkModule>(
  optimizationSdkModules.map((module) => [module.definition.id, module])
);

export class OptimizationSdkRegistry {
  static get(id: OptimizationId): OptimizationSdkModule {
    const module = modules.get(id);

    if (!module) {
      throw new Error(`Missing optimization SDK module for ${id}`);
    }

    return module;
  }

  static getAll(): OptimizationSdkModule[] {
    return optimizationSdkModules;
  }

  static getDefinitions() {
    return optimizationSdkModules.map((module) => module.definition);
  }

  static async detect(id: OptimizationId): Promise<OptimizationEngineResult> {
    return this.get(id).detector.detect();
  }

  static async analyze(deviceType: MockDeviceType): Promise<OptimizationSdkOutput[]> {
    return Promise.all(
      optimizationSdkModules.map(async (module) => {
        const result = await module.detector.detect();
        const normalizedStatus = normalizeOptimizationStatus(result.currentState);
        const evaluation = module.evaluator.evaluate({
          definition: module.definition,
          detectedStatus: normalizedStatus,
          deviceType
        });

        return {
          definition: module.definition,
          detection: {
            rawStatus: result.currentState,
            normalizedStatus,
            result
          },
          evaluation
        };
      })
    );
  }

  static evaluate(id: OptimizationId, detectedStatus: OptimizationStatus, deviceType: MockDeviceType) {
    const module = this.get(id);
    return module.evaluator.evaluate({
      definition: module.definition,
      detectedStatus: normalizeOptimizationStatus(detectedStatus),
      deviceType
    });
  }
}
