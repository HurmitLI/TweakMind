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
  readPendingApplyResult,
  readPendingRecoveryResult,
  type OptimizationHistoryEntry,
  type OptimizationRecoveryResult,
  WindowsOptimizationService
} from "../../windows/WindowsOptimizationService";
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

async function verifyCoreIsolationApply(): Promise<VerificationExecutionResult> {
  const applyResult = readPendingApplyResult("core-isolation");

  if (!applyResult) {
    return {
      ...unavailable("No completed Apply result was found. Verification is pending."),
      expectedState: "Enabled"
    };
  }

  if (applyResult.status !== "success" || applyResult.applyMode !== "real") {
    return {
      ...unavailable("Only successful real Core Isolation Apply results can be verified in this MVP step."),
      previousState: applyResult.previousState,
      expectedState: "Enabled"
    };
  }

  const expectedState = "Enabled";
  const detection = await OptimizationSdkRegistry.detect("core-isolation");
  const actualState = detection.currentState || "Unknown";
  const verified = detection.success && actualState === expectedState;

  return {
    optimizationId: "core-isolation",
    status: verified ? "Verified" : "Failed",
    previousState: applyResult.previousState,
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

    return verifyCoreIsolationApply();
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
