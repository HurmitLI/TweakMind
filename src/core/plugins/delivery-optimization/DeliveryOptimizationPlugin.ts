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

const EXPECTED_APPLY_STATE = "Disabled";

function unavailable(message: string, historyEntryId?: string): VerificationExecutionResult {
  return {
    historyEntryId,
    optimizationId: "delivery-optimization",
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

async function applyDeliveryOptimization(): Promise<ApplyExecutionResult> {
  if (!isTauriRuntime()) {
    return {
      optimizationId: "delivery-optimization",
      applyMode: "unsupported",
      status: "unsupported",
      previousState: "Unknown",
      currentState: "Unknown",
      error:
        "Real Delivery Optimization Apply is only available inside the Tauri desktop app. No Windows changes were made.",
      timestamp: nowTimestamp()
    };
  }

  try {
    return await invoke<ApplyExecutionResult>("apply_delivery_optimization");
  } catch (error) {
    return {
      optimizationId: "delivery-optimization",
      applyMode: "real",
      status: "failed",
      previousState: "Unknown",
      currentState: "Unknown",
      error: error instanceof Error ? error.message : String(error),
      timestamp: nowTimestamp()
    };
  }
}

async function verifyDeliveryOptimizationApply(historyEntryId?: string): Promise<VerificationExecutionResult> {
  const resolution = resolveApplyVerificationSource("delivery-optimization", EXPECTED_APPLY_STATE, historyEntryId);

  if (!resolution.ok) {
    if (resolution.reason === "missing") {
      return {
        ...unavailable("No completed Apply result was found. Verification is pending.", historyEntryId),
        expectedState: EXPECTED_APPLY_STATE
      };
    }

    return {
      ...unavailable("Only successful real Delivery Optimization Apply results can be verified in this MVP step.", historyEntryId),
      previousState: resolution.previousState ?? "Unknown",
      expectedState: EXPECTED_APPLY_STATE
    };
  }

  const { previousState, expectedState, historyEntryId: resolvedHistoryEntryId } = resolution.source;
  const detection = await OptimizationSdkRegistry.detect("delivery-optimization");
  const actualState = detection.currentState || "Unknown";
  const verified = detection.success && actualState === expectedState;

  return {
    historyEntryId: resolvedHistoryEntryId,
    optimizationId: "delivery-optimization",
    status: verified ? "Verified" : "Failed",
    previousState,
    expectedState,
    actualState,
    message: verified
      ? "Delivery Optimization is now detected as Disabled (HTTP only, no peer sharing)."
      : `Expected Delivery Optimization to be Disabled, but detected ${actualState}.`,
    timestamp: nowTimestamp()
  };
}

async function verifyDeliveryOptimizationRecovery(historyEntryId: string): Promise<VerificationExecutionResult> {
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
  const detection = await OptimizationSdkRegistry.detect("delivery-optimization");
  const actualState = detection.currentState || "Unknown";
  const verified = detection.success && actualState === expectedState;

  return {
    historyEntryId,
    optimizationId: "delivery-optimization",
    status: verified ? "Verified" : "Failed",
    previousState: recoveryResult?.actualState ?? historyEntry?.recoveryActualState ?? "Unknown",
    expectedState,
    actualState,
    message: verified
      ? `Delivery Optimization is now detected as ${expectedState}.`
      : `Expected Delivery Optimization to be ${expectedState}, but detected ${actualState}.`,
    timestamp: nowTimestamp()
  };
}

async function recoverDeliveryOptimization(historyEntryId: string): Promise<RecoveryExecutionResult> {
  const entry = WindowsOptimizationService.getHistoryEntry(historyEntryId);

  if (!entry) {
    return {
      historyEntryId,
      optimizationId: "delivery-optimization",
      status: "failed",
      previousState: "Unknown",
      expectedState: "Unknown",
      actualState: "Unknown",
      error: "A valid History record is required before Recovery can start.",
      timestamp: nowTimestamp()
    };
  }

  WindowsOptimizationService.recordRecoveryStarted(entry.id);

  if (entry.optimizationId !== "delivery-optimization" || entry.applyMode !== "real" || entry.status !== "Success") {
    return unsupportedRecoveryResult(
      entry,
      "Recovery is available only for successful Delivery Optimization Real Apply records."
    );
  }

  if (!isTauriRuntime()) {
    return unsupportedRecoveryResult(
      entry,
      "Real Recovery is only available inside the Tauri desktop app. No Windows changes were made."
    );
  }

  try {
    const nativeResult = await invoke<Omit<OptimizationRecoveryResult, "historyEntryId">>(
      "restore_delivery_optimization",
      {
        previousState: entry.previousState,
        previousStartupType: entry.previousStartupType
      }
    );

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

export const DeliveryOptimizationPlugin: OptimizationPlugin = {
  id: "delivery-optimization",
  knowledgeId: "delivery-optimization",
  capabilities: {
    canRealApply: true,
    canVerify: true,
    canRecover: true,
    applyMode: "real",
    verificationMode: "real",
    recoveryMode: "real"
  },
  scan(): Promise<OptimizationEngineResult> {
    return OptimizationSdkRegistry.detect("delivery-optimization");
  },
  apply(): Promise<ApplyExecutionResult> {
    return applyDeliveryOptimization();
  },
  verify(context?: OptimizationPluginContext): Promise<VerificationExecutionResult> {
    if (context?.verificationMode === "recovery") {
      return verifyDeliveryOptimizationRecovery(context.historyEntryId ?? "");
    }

    return verifyDeliveryOptimizationApply(context?.historyEntryId);
  },
  recover(context?: OptimizationPluginContext): Promise<RecoveryExecutionResult> {
    const historyEntryId = context?.historyEntryId;

    if (!historyEntryId) {
      return Promise.resolve({
        historyEntryId: "",
        optimizationId: "delivery-optimization",
        status: "failed",
        previousState: "Unknown",
        expectedState: "Unknown",
        actualState: "Unknown",
        error: "A valid History record is required before Recovery can start.",
        timestamp: nowTimestamp()
      });
    }

    return recoverDeliveryOptimization(historyEntryId);
  }
};
