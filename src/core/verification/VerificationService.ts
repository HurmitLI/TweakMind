import type { OptimizationId, OptimizationStatus } from "../../types/optimization";
import { OptimizationSdkRegistry } from "../sdk/OptimizationSdkRegistry";
import { readPendingApplyResult, WindowsOptimizationService } from "../windows/WindowsOptimizationService";
import type { VerificationResult } from "./VerificationResult";

function nowTimestamp() {
  return Math.floor(Date.now() / 1000).toString();
}

function unavailable(
  optimizationId: OptimizationId,
  previousState: OptimizationStatus = "Unknown",
  expectedState: OptimizationStatus = "Unknown",
  message = "Verification is not available for this optimization yet."
): VerificationResult {
  return {
    optimizationId,
    status: "Pending / Not Available",
    previousState,
    expectedState,
    actualState: "Unknown",
    message,
    timestamp: nowTimestamp()
  };
}

export class VerificationService {
  static async verify(optimizationId: OptimizationId): Promise<VerificationResult> {
    const applyResult = readPendingApplyResult(optimizationId);

    if (optimizationId !== "windows-search") {
      return unavailable(optimizationId);
    }

    if (!applyResult) {
      return unavailable(
        optimizationId,
        "Unknown",
        "Disabled",
        "No completed Apply result was found. Verification is pending."
      );
    }

    if (applyResult.status !== "success") {
      return unavailable(
        optimizationId,
        applyResult.previousState,
        "Disabled",
        "Apply did not complete successfully, so verification cannot run."
      );
    }

    if (applyResult.applyMode !== "real") {
      return unavailable(
        optimizationId,
        applyResult.previousState,
        "Disabled",
        "Only real Windows Search Apply results can be verified in this MVP step."
      );
    }

    const expectedState: OptimizationStatus = "Disabled";
    const detection = await OptimizationSdkRegistry.detect("windows-search");
    const actualState = detection.currentState || "Unknown";
    const verified = detection.success && actualState === expectedState;
    const result: VerificationResult = {
      optimizationId,
      status: verified ? "Verified" : "Failed",
      previousState: applyResult.previousState,
      expectedState,
      actualState,
      message: verified
        ? "Windows Search is now detected as Disabled."
        : `Expected Windows Search to be Disabled, but detected ${actualState}.`,
      timestamp: nowTimestamp()
    };

    WindowsOptimizationService.recordVerification(result);
    return result;
  }
}
