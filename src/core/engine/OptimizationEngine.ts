import type { OptimizationId, OptimizationStatus } from "../../types/optimization";

export type OptimizationEngineStatus = "Success" | "Failed";

export interface OptimizationEngineResult {
  success: boolean;
  status: OptimizationEngineStatus;
  previousState: OptimizationStatus;
  currentState: OptimizationStatus;
  message: string;
  timestamp: string;
}

export interface OptimizationEngine {
  id: OptimizationId;
  detect(): Promise<OptimizationEngineResult>;
  apply(): Promise<OptimizationEngineResult>;
  restore(previousState: OptimizationStatus): Promise<OptimizationEngineResult>;
}

export function createEngineResult(
  input: Omit<OptimizationEngineResult, "success" | "timestamp"> & {
    success?: boolean;
    timestamp?: string;
  }
): OptimizationEngineResult {
  return {
    success: input.success ?? input.status === "Success",
    status: input.status,
    previousState: input.previousState,
    currentState: input.currentState,
    message: input.message,
    timestamp: input.timestamp ?? Math.floor(Date.now() / 1000).toString()
  };
}
