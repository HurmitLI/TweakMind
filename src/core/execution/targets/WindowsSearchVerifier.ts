import { OptimizationSdkRegistry } from "../../sdk/OptimizationSdkRegistry";
import {
  readPendingApplyResult,
  readPendingRecoveryResult,
  WindowsOptimizationService
} from "../../windows/WindowsOptimizationService";
import type { VerificationExecutionResult } from "../OptimizationExecutionTypes";
import { nowTimestamp } from "./ExecutionRuntime";

function unavailable(message: string, historyEntryId?: string): VerificationExecutionResult {
  return {
    historyEntryId,
    optimizationId: "windows-search",
    status: "Pending / Not Available",
    previousState: "Unknown",
    expectedState: "Unknown",
    actualState: "Unknown",
    message,
    timestamp: nowTimestamp()
  };
}

export class WindowsSearchVerifier {
  async verifyApply(): Promise<VerificationExecutionResult> {
    const applyResult = readPendingApplyResult("windows-search");

    if (!applyResult) {
      return {
        ...unavailable("No completed Apply result was found. Verification is pending."),
        expectedState: "Disabled"
      };
    }

    if (applyResult.status !== "success" || applyResult.applyMode !== "real") {
      return {
        ...unavailable("Only successful real Windows Search Apply results can be verified in this MVP step."),
        previousState: applyResult.previousState,
        expectedState: "Disabled"
      };
    }

    const expectedState = "Disabled";
    const detection = await OptimizationSdkRegistry.detect("windows-search");
    const actualState = detection.currentState || "Unknown";
    const verified = detection.success && actualState === expectedState;

    return {
      optimizationId: "windows-search",
      status: verified ? "Verified" : "Failed",
      previousState: applyResult.previousState,
      expectedState,
      actualState,
      message: verified
        ? "Windows Search is now detected as Disabled."
        : `Expected Windows Search to be Disabled, but detected ${actualState}.`,
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
    const detection = await OptimizationSdkRegistry.detect("windows-search");
    const actualState = detection.currentState || "Unknown";
    const verified = detection.success && actualState === expectedState;

    return {
      historyEntryId,
      optimizationId: "windows-search",
      status: verified ? "Verified" : "Failed",
      previousState: recoveryResult?.actualState ?? historyEntry?.recoveryActualState ?? "Unknown",
      expectedState,
      actualState,
      message: verified
        ? `Windows Search is now detected as ${expectedState}.`
        : `Expected Windows Search to be ${expectedState}, but detected ${actualState}.`,
      timestamp: nowTimestamp()
    };
  }
}
