import type { OptimizationId } from "../../types/optimization";
import type { OptimizationExecutionCapabilities } from "./OptimizationExecutionTypes";

const unsupportedCapabilities: OptimizationExecutionCapabilities = {
  canRealApply: false,
  canVerify: false,
  canRecover: false,
  applyMode: "unsupported",
  verificationMode: "unsupported",
  recoveryMode: "unsupported"
};

const capabilities: Record<OptimizationId, OptimizationExecutionCapabilities> = {
  "windows-search": {
    canRealApply: true,
    canVerify: true,
    canRecover: true,
    applyMode: "real",
    verificationMode: "real",
    recoveryMode: "real"
  },
  "game-mode": unsupportedCapabilities,
  "core-isolation": unsupportedCapabilities,
  "delivery-optimization": unsupportedCapabilities
};

export class OptimizationCapabilityRegistry {
  static get(id: OptimizationId): OptimizationExecutionCapabilities {
    return capabilities[id] ?? unsupportedCapabilities;
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
