import type { OptimizationId, OptimizationStatus } from "../../types/optimization";

export type VerificationStatus = "Verified" | "Failed" | "Pending / Not Available";

export interface VerificationResult {
  optimizationId: OptimizationId;
  status: VerificationStatus;
  previousState: OptimizationStatus;
  expectedState: OptimizationStatus;
  actualState: OptimizationStatus;
  message: string;
  timestamp: string;
}
