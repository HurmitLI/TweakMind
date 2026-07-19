import { OptimizationSdkRegistry } from "../../sdk/OptimizationSdkRegistry";
import {
  readPendingRecoveryResult,
  WindowsOptimizationService
} from "../../windows/WindowsOptimizationService";
import type { VerificationExecutionResult } from "../OptimizationExecutionTypes";
import { resolveApplyVerificationSource } from "./ApplyVerificationSupport";
import { nowTimestamp } from "./ExecutionRuntime";
import { resolveRecoveryVerificationAssociation } from "./RecoveryVerificationSupport";

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
  async verifyApply(historyEntryId?: string): Promise<VerificationExecutionResult> {
    const expectedState = "Disabled";
    const resolution = resolveApplyVerificationSource("windows-search", expectedState, historyEntryId);

    if (!resolution.ok) {
      if (resolution.reason === "missing") {
        return {
          ...unavailable("No completed Apply result was found. Verification is pending.", historyEntryId),
          expectedState
        };
      }

      return {
        ...unavailable("Only successful real Windows Search Apply results can be verified in this MVP step.", historyEntryId),
        previousState: resolution.previousState ?? "Unknown",
        expectedState
      };
    }

    const { previousState, expectedState: resolvedExpectedState, historyEntryId: resolvedHistoryEntryId } =
      resolution.source;
    const detection = await OptimizationSdkRegistry.detect("windows-search");
    const actualState = detection.currentState || "Unknown";
    const verified = detection.success && actualState === resolvedExpectedState;

    return {
      historyEntryId: resolvedHistoryEntryId,
      optimizationId: "windows-search",
      status: verified ? "Verified" : "Failed",
      previousState,
      expectedState: resolvedExpectedState,
      actualState,
      message: verified
        ? "Windows Search is now detected as Disabled."
        : `Expected Windows Search to be Disabled, but detected ${actualState}.`,
      timestamp: nowTimestamp()
    };
  }

  async verifyRecovery(historyEntryId: string): Promise<VerificationExecutionResult> {
    const association = resolveRecoveryVerificationAssociation("windows-search", historyEntryId);

    if (!association.ok) {
      return unavailable(
        association.reason === "mismatch"
          ? "Recovery verification target does not match this optimization or history entry."
          : "No completed Recovery result was found. Verification is pending.",
        historyEntryId
      );
    }

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
