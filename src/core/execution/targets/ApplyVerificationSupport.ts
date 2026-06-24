import type { OptimizationId, OptimizationStatus } from "../../../types/optimization";
import {
  readPendingApplyResult,
  WindowsOptimizationService
} from "../../windows/WindowsOptimizationService";

export interface ApplyVerificationSource {
  previousState: OptimizationStatus;
  expectedState: OptimizationStatus;
  historyEntryId?: string;
}

export type ApplyVerificationResolution =
  | { ok: true; source: ApplyVerificationSource }
  | { ok: false; reason: "missing" | "notSuccessful" | "notReal"; previousState?: OptimizationStatus };

export function resolveApplyVerificationSource(
  optimizationId: OptimizationId,
  fallbackExpectedState: OptimizationStatus,
  historyEntryId?: string
): ApplyVerificationResolution {
  const applyResult = readPendingApplyResult(optimizationId);

  if (applyResult) {
    if (applyResult.status !== "success") {
      return {
        ok: false,
        reason: "notSuccessful",
        previousState: applyResult.previousState
      };
    }

    if (applyResult.applyMode !== "real") {
      return {
        ok: false,
        reason: "notReal",
        previousState: applyResult.previousState
      };
    }

    return {
      ok: true,
      source: {
        previousState: applyResult.previousState,
        expectedState: fallbackExpectedState,
        historyEntryId: applyResult.historyEntryId
      }
    };
  }

  if (!historyEntryId) {
    return { ok: false, reason: "missing" };
  }

  const historyEntry = WindowsOptimizationService.getHistoryEntry(historyEntryId);

  if (!historyEntry || historyEntry.optimizationId !== optimizationId) {
    return { ok: false, reason: "missing" };
  }

  if (historyEntry.status !== "Success") {
    return {
      ok: false,
      reason: "notSuccessful",
      previousState: historyEntry.previousState
    };
  }

  if (historyEntry.applyMode !== "real") {
    return {
      ok: false,
      reason: "notReal",
      previousState: historyEntry.previousState
    };
  }

  return {
    ok: true,
    source: {
      previousState: historyEntry.previousState,
      expectedState: historyEntry.newState,
      historyEntryId: historyEntry.id
    }
  };
}
