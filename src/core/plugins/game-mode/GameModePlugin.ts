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
    optimizationId: "game-mode",
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

async function applyGameMode(): Promise<ApplyExecutionResult> {
  if (!isTauriRuntime()) {
    return {
      optimizationId: "game-mode",
      applyMode: "unsupported",
      status: "unsupported",
      previousState: "Unknown",
      currentState: "Unknown",
      error: "Real Game Mode Apply is only available inside the Tauri desktop app. No Windows changes were made.",
      timestamp: nowTimestamp()
    };
  }

  try {
    return await invoke<ApplyExecutionResult>("apply_game_mode");
  } catch (error) {
    return {
      optimizationId: "game-mode",
      applyMode: "real",
      status: "failed",
      previousState: "Unknown",
      currentState: "Unknown",
      error: error instanceof Error ? error.message : String(error),
      timestamp: nowTimestamp()
    };
  }
}

async function verifyGameModeApply(historyEntryId?: string): Promise<VerificationExecutionResult> {
  const fallbackExpectedState = "Enabled";
  const resolution = resolveApplyVerificationSource("game-mode", fallbackExpectedState, historyEntryId);

  if (!resolution.ok) {
    if (resolution.reason === "missing") {
      return {
        ...unavailable("No completed Apply result was found. Verification is pending.", historyEntryId),
        expectedState: fallbackExpectedState
      };
    }

    return {
      ...unavailable("Only successful real Game Mode Apply results can be verified in this MVP step.", historyEntryId),
      previousState: resolution.previousState ?? "Unknown",
      expectedState: fallbackExpectedState
    };
  }

  const { previousState, expectedState, historyEntryId: resolvedHistoryEntryId } = resolution.source;
  const detection = await OptimizationSdkRegistry.detect("game-mode");
  const actualState = detection.currentState || "Unknown";
  const verified = detection.success && actualState === expectedState;

  return {
    historyEntryId: resolvedHistoryEntryId,
    optimizationId: "game-mode",
    status: verified ? "Verified" : "Failed",
    previousState,
    expectedState,
    actualState,
    message: verified
      ? "Game Mode is now detected as Enabled."
      : `Expected Game Mode to be Enabled, but detected ${actualState}.`,
    timestamp: nowTimestamp()
  };
}

async function verifyGameModeRecovery(historyEntryId: string): Promise<VerificationExecutionResult> {
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
  const detection = await OptimizationSdkRegistry.detect("game-mode");
  const actualState = detection.currentState || "Unknown";
  const verified = detection.success && actualState === expectedState;

  return {
    historyEntryId,
    optimizationId: "game-mode",
    status: verified ? "Verified" : "Failed",
    previousState: recoveryResult?.actualState ?? historyEntry?.recoveryActualState ?? "Unknown",
    expectedState,
    actualState,
    message: verified
      ? `Game Mode is now detected as ${expectedState}.`
      : `Expected Game Mode to be ${expectedState}, but detected ${actualState}.`,
    timestamp: nowTimestamp()
  };
}

async function recoverGameMode(historyEntryId: string): Promise<RecoveryExecutionResult> {
  const entry = WindowsOptimizationService.getHistoryEntry(historyEntryId);

  if (!entry) {
    return {
      historyEntryId,
      optimizationId: "game-mode",
      status: "failed",
      previousState: "Unknown",
      expectedState: "Unknown",
      actualState: "Unknown",
      error: "A valid History record is required before Recovery can start.",
      timestamp: nowTimestamp()
    };
  }

  WindowsOptimizationService.recordRecoveryStarted(entry.id);

  if (entry.optimizationId !== "game-mode" || entry.applyMode !== "real" || entry.status !== "Success") {
    return unsupportedRecoveryResult(entry, "Recovery is available only for successful Game Mode Real Apply records.");
  }

  if (!isTauriRuntime()) {
    return unsupportedRecoveryResult(entry, "Real Recovery is only available inside the Tauri desktop app. No Windows changes were made.");
  }

  try {
    const nativeResult = await invoke<Omit<OptimizationRecoveryResult, "historyEntryId">>("restore_game_mode", {
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

export const GameModePlugin: OptimizationPlugin = {
  id: "game-mode",
  knowledgeId: "game-mode",
  capabilities: {
    canRealApply: true,
    canVerify: true,
    canRecover: true,
    applyMode: "real",
    verificationMode: "real",
    recoveryMode: "real"
  },
  scan(): Promise<OptimizationEngineResult> {
    return OptimizationSdkRegistry.detect("game-mode");
  },
  apply(): Promise<ApplyExecutionResult> {
    return applyGameMode();
  },
  verify(context?: OptimizationPluginContext): Promise<VerificationExecutionResult> {
    if (context?.verificationMode === "recovery") {
      return verifyGameModeRecovery(context.historyEntryId ?? "");
    }

    return verifyGameModeApply(context?.historyEntryId);
  },
  recover(context?: OptimizationPluginContext): Promise<RecoveryExecutionResult> {
    const historyEntryId = context?.historyEntryId;

    if (!historyEntryId) {
      return Promise.resolve({
        historyEntryId: "",
        optimizationId: "game-mode",
        status: "failed",
        previousState: "Unknown",
        expectedState: "Unknown",
        actualState: "Unknown",
        error: "A valid History record is required before Recovery can start.",
        timestamp: nowTimestamp()
      });
    }

    return recoverGameMode(historyEntryId);
  }
};
