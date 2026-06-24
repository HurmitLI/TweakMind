import { invoke } from "@tauri-apps/api/core";
import type { OptimizationEngineResult } from "../../engine/OptimizationEngine";
import type {
  ApplyExecutionResult,
  RecoveryExecutionResult,
  VerificationExecutionResult
} from "../../execution/OptimizationExecutionTypes";
import { isTauriRuntime, nowTimestamp } from "../../execution/targets/ExecutionRuntime";
import { OptimizationSdkRegistry } from "../../sdk/OptimizationSdkRegistry";
import {
  readPendingRecoveryResult,
  type OptimizationHistoryEntry,
  type OptimizationRecoveryResult,
  WindowsOptimizationService
} from "../../windows/WindowsOptimizationService";
import { resolveApplyVerificationSource } from "../../execution/targets/ApplyVerificationSupport";
import type { OptimizationPlugin, OptimizationPluginContext } from "../OptimizationPluginTypes";

const EXPECTED_APPLY_STATE = "Enabled";

function unavailable(message: string, historyEntryId?: string): VerificationExecutionResult {
  return {
    historyEntryId,
    optimizationId: "hags",
    status: "Pending / Not Available",
    previousState: "Unknown",
    expectedState: "Unknown",
    actualState: "Unknown",
    message,
    timestamp: nowTimestamp()
  };
}

function unsupportedRecoveryResult(entry: OptimizationHistoryEntry, message: string): RecoveryExecutionResult {
  return {
    historyEntryId: entry.id,
    optimizationId: entry.optimizationId,
    status: "unsupported",
    previousState: entry.previousState,
    expectedState: entry.previousState,
    actualState: "Unknown",
    previousStartupType: entry.previousStartupType,
    error: message,
    timestamp: nowTimestamp()
  };
}

async function applyHags(): Promise<ApplyExecutionResult> {
  if (!isTauriRuntime()) {
    return {
      optimizationId: "hags",
      applyMode: "unsupported",
      status: "unsupported",
      previousState: "Unknown",
      currentState: "Unknown",
      error:
        "Real HAGS Apply is only available inside the Tauri desktop app. No Windows changes were made.",
      timestamp: nowTimestamp()
    };
  }

  try {
    return await invoke<ApplyExecutionResult>("apply_hags");
  } catch (error) {
    return {
      optimizationId: "hags",
      applyMode: "real",
      status: "failed",
      previousState: "Unknown",
      currentState: "Unknown",
      error: error instanceof Error ? error.message : String(error),
      timestamp: nowTimestamp()
    };
  }
}

async function verifyHagsApply(historyEntryId?: string): Promise<VerificationExecutionResult> {
  const resolution = resolveApplyVerificationSource("hags", EXPECTED_APPLY_STATE, historyEntryId);

  if (!resolution.ok) {
    if (resolution.reason === "missing") {
      return {
        ...unavailable("No completed Apply result was found. Verification is pending.", historyEntryId),
        expectedState: EXPECTED_APPLY_STATE
      };
    }

    return {
      ...unavailable("Only successful real HAGS Apply results can be verified in this MVP step.", historyEntryId),
      previousState: resolution.previousState ?? "Unknown",
      expectedState: EXPECTED_APPLY_STATE
    };
  }

  const { previousState, expectedState, historyEntryId: resolvedHistoryEntryId } = resolution.source;
  const detection = await OptimizationSdkRegistry.detect("hags");
  const actualState = detection.currentState || "Unknown";
  const verified = detection.success && actualState === expectedState;

  return {
    historyEntryId: resolvedHistoryEntryId,
    optimizationId: "hags",
    status: verified ? "Verified" : "Failed",
    previousState,
    expectedState,
    actualState,
    message: verified
      ? "HAGS is now detected as Enabled."
      : `Expected HAGS to be Enabled, but detected ${actualState}. A restart may be required before the change takes full effect.`,
    timestamp: nowTimestamp()
  };
}

async function verifyHagsRecovery(historyEntryId: string): Promise<VerificationExecutionResult> {
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
  const detection = await OptimizationSdkRegistry.detect("hags");
  const actualState = detection.currentState || "Unknown";
  const verified = detection.success && actualState === expectedState;

  return {
    historyEntryId,
    optimizationId: "hags",
    status: verified ? "Verified" : "Failed",
    previousState: recoveryResult?.actualState ?? historyEntry?.recoveryActualState ?? "Unknown",
    expectedState,
    actualState,
    message: verified
      ? `HAGS is now detected as ${expectedState}.`
      : `Expected HAGS to be ${expectedState}, but detected ${actualState}. A restart may be required before the change takes full effect.`,
    timestamp: nowTimestamp()
  };
}

async function recoverHags(historyEntryId: string): Promise<RecoveryExecutionResult> {
  const entry = WindowsOptimizationService.getHistoryEntry(historyEntryId);

  if (!entry) {
    return {
      historyEntryId,
      optimizationId: "hags",
      status: "failed",
      previousState: "Unknown",
      expectedState: "Unknown",
      actualState: "Unknown",
      error: "A valid History record is required before Recovery can start.",
      timestamp: nowTimestamp()
    };
  }

  WindowsOptimizationService.recordRecoveryStarted(entry.id);

  if (entry.optimizationId !== "hags" || entry.applyMode !== "real" || entry.status !== "Success") {
    return unsupportedRecoveryResult(entry, "Recovery is available only for successful HAGS Real Apply records.");
  }

  if (!isTauriRuntime()) {
    return unsupportedRecoveryResult(
      entry,
      "Real HAGS Recovery is only available inside the Tauri desktop app. No Windows changes were made."
    );
  }

  try {
    const nativeResult = await invoke<Omit<OptimizationRecoveryResult, "historyEntryId">>("restore_hags", {
      previousState: entry.previousState,
      previousStartupType: entry.previousStartupType
    });

    return {
      ...nativeResult,
      historyEntryId: entry.id
    };
  } catch (error) {
    return {
      historyEntryId: entry.id,
      optimizationId: entry.optimizationId,
      status: "failed",
      previousState: entry.previousState,
      expectedState: entry.previousState,
      actualState: "Unknown",
      previousStartupType: entry.previousStartupType,
      error: error instanceof Error ? error.message : String(error),
      timestamp: nowTimestamp()
    };
  }
}

export const HagsPlugin: OptimizationPlugin = {
  id: "hags",
  knowledgeId: "hags",
  capabilities: {
    canRealApply: true,
    canVerify: true,
    canRecover: true,
    applyMode: "real",
    verificationMode: "real",
    recoveryMode: "real"
  },
  scan(): Promise<OptimizationEngineResult> {
    return OptimizationSdkRegistry.detect("hags");
  },
  apply(): Promise<ApplyExecutionResult> {
    return applyHags();
  },
  verify(context?: OptimizationPluginContext): Promise<VerificationExecutionResult> {
    if (context?.verificationMode === "recovery") {
      return verifyHagsRecovery(context.historyEntryId ?? "");
    }

    return verifyHagsApply(context?.historyEntryId);
  },
  recover(context?: OptimizationPluginContext): Promise<RecoveryExecutionResult> {
    const historyEntryId = context?.historyEntryId;

    if (!historyEntryId) {
      return Promise.resolve({
        historyEntryId: "",
        optimizationId: "hags",
        status: "failed",
        previousState: "Unknown",
        expectedState: "Unknown",
        actualState: "Unknown",
        error: "A valid History record is required before Recovery can start.",
        timestamp: nowTimestamp()
      });
    }

    return recoverHags(historyEntryId);
  }
};
