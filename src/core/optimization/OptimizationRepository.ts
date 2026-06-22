import type { OptimizationDefinition, OptimizationId } from "../../types/optimization";
import { OptimizationSdkRegistry } from "../sdk/OptimizationSdkRegistry";

export class OptimizationRepository {
  static getAll(): OptimizationDefinition[] {
    return OptimizationSdkRegistry.getDefinitions();
  }

  static getById(id: OptimizationId): OptimizationDefinition | undefined {
    return this.getAll().find((optimization) => optimization.id === id);
  }

  static getDefault(): OptimizationDefinition {
    return this.getAll()[0];
  }
}
