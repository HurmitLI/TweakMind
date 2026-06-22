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

const EXPECTED_APPLY_STATE = "Enabled";

function unavailable(message: string, historyEntryId?: string): VerificationExecutionResult {
  return {
    historyEntryId,
    optimizationId: "power-plan",
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

async function applyPowerPlan(): Promise<ApplyExecutionResult> {
  if (!isTauriRuntime()) {
    return {
      optimizationId: "power-plan",
      applyMode: "unsupported",
      status: "unsupported",
      previousState: "Unknown",
      currentState: "Unknown",
      error:
        "Real Power Plan Apply is only available inside the Tauri desktop app. No Windows changes were made.",
      timestamp: nowTimestamp()
    };
  }

  try {
    return await invoke<ApplyExecutionResult>("apply_power_plan");
  } catch (error) {
    return {
      optimizationId: "power-plan",
      applyMode: "real",
      status: "failed",
      previousState: "Unknown",
      currentState: "Unknown",
      error: error instanceof Error ? error.message : String(error),
      timestamp: nowTimestamp()
    };
  }
}

async function verifyPowerPlanApply(): Promise<VerificationExecutionResult> {
  const applyResult = readPendingApplyResult("power-plan");

  if (!applyResult) {
    return {
      ...unavailable("No completed Apply result was found. Verification is pending."),
      expectedState: EXPECTED_APPLY_STATE
    };
  }

  if (applyResult.status !== "success" || applyResult.applyMode !== "real") {
    return {
      ...unavailable("Only successful real Power Plan Apply results can be verified in this MVP step."),
      previousState: applyResult.previousState,
      expectedState: EXPECTED_APPLY_STATE
    };
  }

  const detection = await OptimizationSdkRegistry.detect("power-plan");
  const actualState = detection.currentState || "Unknown";
  const verified = detection.success && actualState === EXPECTED_APPLY_STATE;

  return {
    optimizationId: "power-plan",
    status: verified ? "Verified" : "Failed",
    previousState: applyResult.previousState,
    expectedState: EXPECTED_APPLY_STATE,
    actualState,
    message: verified
      ? "Power plan is now detected as High performance."
      : `Expected High performance power plan, but detected ${actualState}.`,
    timestamp: nowTimestamp()
  };
}

async function verifyPowerPlanRecovery(historyEntryId: string): Promise<VerificationExecutionResult> {
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
  const detection = await OptimizationSdkRegistry.detect("power-plan");
  const actualState = detection.currentState || "Unknown";
  const verified = detection.success && actualState === expectedState;

  return {
    historyEntryId,
    optimizationId: "power-plan",
    status: verified ? "Verified" : "Failed",
    previousState: recoveryResult?.actualState ?? historyEntry?.recoveryActualState ?? "Unknown",
    expectedState,
    actualState,
    message: verified
      ? `Power plan is now detected as ${expectedState}.`
      : `Expected power plan to be ${expectedState}, but detected ${actualState}.`,
    timestamp: nowTimestamp()
  };
}

async function recoverPowerPlan(historyEntryId: string): Promise<RecoveryExecutionResult> {
  const entry = WindowsOptimizationService.getHistoryEntry(historyEntryId);

  if (!entry) {
    return {
      historyEntryId,
      optimizationId: "power-plan",
      status: "failed",
      previousState: "Unknown",
      expectedState: "Unknown",
      actualState: "Unknown",
      error: "A valid History record is required before Recovery can start.",
      timestamp: nowTimestamp()
    };
  }

  WindowsOptimizationService.recordRecoveryStarted(entry.id);

  if (entry.optimizationId !== "power-plan" || entry.applyMode !== "real" || entry.status !== "Success") {
    return unsupportedRecoveryResult(
      entry,
      "Recovery is available only for successful Power Plan Real Apply records."
    );
  }

  if (!isTauriRuntime()) {
    return unsupportedRecoveryResult(
      entry,
      "Real Power Plan Recovery is only available inside the Tauri desktop app. No Windows changes were made."
    );
  }

  try {
    const nativeResult = await invoke<Omit<OptimizationRecoveryResult, "historyEntryId">>("restore_power_plan", {
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

export const PowerPlanPlugin: OptimizationPlugin = {
  id: "power-plan",
  knowledgeId: "power-plan",
  capabilities: {
    canRealApply: true,
    canVerify: true,
    canRecover: true,
    applyMode: "real",
    verificationMode: "real",
    recoveryMode: "real"
  },
  scan(): Promise<OptimizationEngineResult> {
    return OptimizationSdkRegistry.detect("power-plan");
  },
  apply(): Promise<ApplyExecutionResult> {
    return applyPowerPlan();
  },
  verify(context?: OptimizationPluginContext): Promise<VerificationExecutionResult> {
    if (context?.verificationMode === "recovery") {
      return verifyPowerPlanRecovery(context.historyEntryId ?? "");
    }

    return verifyPowerPlanApply();
  },
  recover(context?: OptimizationPluginContext): Promise<RecoveryExecutionResult> {
    const historyEntryId = context?.historyEntryId;

    if (!historyEntryId) {
      return Promise.resolve({
        historyEntryId: "",
        optimizationId: "power-plan",
        status: "failed",
        previousState: "Unknown",
        expectedState: "Unknown",
        actualState: "Unknown",
        error: "A valid History record is required before Recovery can start.",
        timestamp: nowTimestamp()
      });
    }

    return recoverPowerPlan(historyEntryId);
  }
};
