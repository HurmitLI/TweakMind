import { OptimizationSdkRegistry } from "../../sdk/OptimizationSdkRegistry";
import {
  readPendingApplyResult,
  readPendingRecoveryResult,
  WindowsOptimizationService
} from "../../windows/WindowsOptimizationService";
import type { VerificationExecutionResult } from "../OptimizationExecutionTypes";
import { nowTimestamp } from "./ExecutionRuntime";

const EXPECTED_APPLY_STATE = "Disabled";

function unavailable(message: string, historyEntryId?: string): VerificationExecutionResult {
  return {
    historyEntryId,
    optimizationId: "sysmain",
    status: "Pending / Not Available",
    previousState: "Unknown",
    expectedState: "Unknown",
    actualState: "Unknown",
    message,
    timestamp: nowTimestamp()
  };
}

export class SysMainVerifier {
  async verifyApply(): Promise<VerificationExecutionResult> {
    const applyResult = readPendingApplyResult("sysmain");

    if (!applyResult) {
      return {
        ...unavailable("No completed Apply result was found. Verification is pending."),
        expectedState: EXPECTED_APPLY_STATE
      };
    }

    if (applyResult.status !== "success" || applyResult.applyMode !== "real") {
      return {
        ...unavailable("Only successful real SysMain Apply results can be verified in this MVP step."),
        previousState: applyResult.previousState,
        expectedState: EXPECTED_APPLY_STATE
      };
    }

    const detection = await OptimizationSdkRegistry.detect("sysmain");
    const actualState = detection.currentState || "Unknown";
    const verified = detection.success && actualState === EXPECTED_APPLY_STATE;

    return {
      optimizationId: "sysmain",
      status: verified ? "Verified" : "Failed",
      previousState: applyResult.previousState,
      expectedState: EXPECTED_APPLY_STATE,
      actualState,
      message: verified
        ? "SysMain is now detected as Disabled."
        : `Expected SysMain to be Disabled, but detected ${actualState}.`,
      timestamp: nowTimestamp()
    };
  }

  async verifyRecovery(historyEntryId: string): Promise<VerificationExecutionResult> {
    const recoveryResult = readPendingRecoveryResult(historyEntryId);
    const historyEntry = WindowsOptimizationService.getHistoryEntry(historyEntryId);

    if (!recoveryResult && historyEntry?.recoveryStatus !== "Success") {
      return unavailable("No completed Recovery result was found. Verification is pending.", historyEntryId);
    }

    if (recoveryResult && recoveryResult.status !== "success") {
      return {
        ...unavailable("Recovery did not complete successfully, so verification cannot run.", historyEntryId),
        previousState: recoveryResult.actualState,
        expectedState: recoveryResult.expectedState
      };
    }

    const expectedState = recoveryResult?.expectedState ?? historyEntry?.recoveryExpectedState ?? "Unknown";
    const detection = await OptimizationSdkRegistry.detect("sysmain");
    const actualState = detection.currentState || "Unknown";
    const verified = detection.success && actualState === expectedState;

    return {
      historyEntryId,
      optimizationId: "sysmain",
      status: verified ? "Verified" : "Failed",
      previousState: recoveryResult?.actualState ?? historyEntry?.recoveryActualState ?? "Unknown",
      expectedState,
      actualState,
      message: verified
        ? `SysMain is now detected as ${expectedState}.`
        : `Expected SysMain to be ${expectedState}, but detected ${actualState}.`,
      timestamp: nowTimestamp()
    };
  }
}
