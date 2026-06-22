import type { OptimizationId } from "../../types/optimization";
import type { OptimizationExecutionTarget } from "./OptimizationExecutionTypes";
import { UnsupportedExecutionTarget } from "./targets/UnsupportedExecutionTarget";
import { WindowsSearchExecutionTarget } from "./targets/WindowsSearchExecutionTarget";

const targets = new Map<OptimizationId, OptimizationExecutionTarget>([
  ["windows-search", WindowsSearchExecutionTarget]
]);

export class OptimizationExecutionRegistry {
  static get(id: OptimizationId): OptimizationExecutionTarget {
    return targets.get(id) ?? new UnsupportedExecutionTarget(id);
  }
}
