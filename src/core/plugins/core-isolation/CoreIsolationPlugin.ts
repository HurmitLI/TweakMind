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

function unavailable(message: string, historyEntryId?: string): VerificationExecutionResult {
  return {
    historyEntryId,
    optimizationId: "core-isolation",
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

async function applyCoreIsolation(): Promise<ApplyExecutionResult> {
  if (!isTauriRuntime()) {
    return {
      optimizationId: "core-isolation",
      applyMode: "unsupported",
      status: "unsupported",
      previousState: "Unknown",
      currentState: "Unknown",
      error:
        "Real Core Isolation Apply is only available inside the Tauri desktop app. No Windows changes were made.",
      timestamp: nowTimestamp()
    };
  }

  try {
    return await invoke<ApplyExecutionResult>("apply_core_isolation");
  } catch (error) {
    return {
      optimizationId: "core-isolation",
      applyMode: "real",
      status: "failed",
      previousState: "Unknown",
      currentState: "Unknown",
      error: error instanceof Error ? error.message : String(error),
      timestamp: nowTimestamp()
    };
  }
}

async function verifyCoreIsolationApply(historyEntryId?: string): Promise<VerificationExecutionResult> {
  const fallbackExpectedState = "Enabled";
  const resolution = resolveApplyVerificationSource("core-isolation", fallbackExpectedState, historyEntryId);

  if (!resolution.ok) {
    if (resolution.reason === "missing") {
      return {
        ...unavailable("No completed Apply result was found. Verification is pending.", historyEntryId),
        expectedState: fallbackExpectedState
      };
    }

    return {
      ...unavailable("Only successful real Core Isolation Apply results can be verified in this MVP step.", historyEntryId),
      previousState: resolution.previousState ?? "Unknown",
      expectedState: fallbackExpectedState
    };
  }

  const { previousState, expectedState, historyEntryId: resolvedHistoryEntryId } = resolution.source;
  const detection = await OptimizationSdkRegistry.detect("core-isolation");
  const actualState = detection.currentState || "Unknown";
  const verified = detection.success && actualState === expectedState;

  return {
    historyEntryId: resolvedHistoryEntryId,
    optimizationId: "core-isolation",
    status: verified ? "Verified" : "Failed",
    previousState,
    expectedState,
    actualState,
    message: verified
      ? "Core Isolation (Memory Integrity) is now detected as Enabled."
      : `Expected Core Isolation to be Enabled, but detected ${actualState}. A restart may be required before the change takes full effect.`,
    timestamp: nowTimestamp()
  };
}

async function verifyCoreIsolationRecovery(historyEntryId: string): Promise<VerificationExecutionResult> {
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
  const detection = await OptimizationSdkRegistry.detect("core-isolation");
  const actualState = detection.currentState || "Unknown";
  const verified = detection.success && actualState === expectedState;

  return {
    historyEntryId,
    optimizationId: "core-isolation",
    status: verified ? "Verified" : "Failed",
    previousState: recoveryResult?.actualState ?? historyEntry?.recoveryActualState ?? "Unknown",
    expectedState,
    actualState,
    message: verified
      ? `Core Isolation is now detected as ${expectedState}.`
      : `Expected Core Isolation to be ${expectedState}, but detected ${actualState}. A restart may be required before the change takes full effect.`,
    timestamp: nowTimestamp()
  };
}

async function recoverCoreIsolation(historyEntryId: string): Promise<RecoveryExecutionResult> {
  const entry = WindowsOptimizationService.getHistoryEntry(historyEntryId);

  if (!entry) {
    return {
      historyEntryId,
      optimizationId: "core-isolation",
      status: "failed",
      previousState: "Unknown",
      expectedState: "Unknown",
      actualState: "Unknown",
      error: "A valid History record is required before Recovery can start.",
      timestamp: nowTimestamp()
    };
  }

  WindowsOptimizationService.recordRecoveryStarted(entry.id);

  if (entry.optimizationId !== "core-isolation" || entry.applyMode !== "real" || entry.status !== "Success") {
    return unsupportedRecoveryResult(
      entry,
      "Recovery is available only for successful Core Isolation Real Apply records."
    );
  }

  if (!isTauriRuntime()) {
    return unsupportedRecoveryResult(
      entry,
      "Real Recovery is only available inside the Tauri desktop app. No Windows changes were made."
    );
  }

  try {
    const nativeResult = await invoke<Omit<OptimizationRecoveryResult, "historyEntryId">>("restore_core_isolation", {
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

export const CoreIsolationPlugin: OptimizationPlugin = {
  id: "core-isolation",
  knowledgeId: "core-isolation",
  capabilities: {
    canRealApply: true,
    canVerify: true,
    canRecover: true,
    applyMode: "real",
    verificationMode: "real",
    recoveryMode: "real"
  },
  scan(): Promise<OptimizationEngineResult> {
    return OptimizationSdkRegistry.detect("core-isolation");
  },
  apply(): Promise<ApplyExecutionResult> {
    return applyCoreIsolation();
  },
  verify(context?: OptimizationPluginContext): Promise<VerificationExecutionResult> {
    if (context?.verificationMode === "recovery") {
      return verifyCoreIsolationRecovery(context.historyEntryId ?? "");
    }

    return verifyCoreIsolationApply(context?.historyEntryId);
  },
  recover(context?: OptimizationPluginContext): Promise<RecoveryExecutionResult> {
    const historyEntryId = context?.historyEntryId;

    if (!historyEntryId) {
      return Promise.resolve({
        historyEntryId: "",
        optimizationId: "core-isolation",
        status: "failed",
        previousState: "Unknown",
        expectedState: "Unknown",
        actualState: "Unknown",
        error: "A valid History record is required before Recovery can start.",
        timestamp: nowTimestamp()
      });
    }

    return recoverCoreIsolation(historyEntryId);
  }
};
