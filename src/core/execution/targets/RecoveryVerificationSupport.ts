import type { OptimizationId } from "../../../types/optimization";
import {
  readPendingRecoveryResult,
  WindowsOptimizationService
} from "../../windows/WindowsOptimizationService";

export type RecoveryVerificationAssociation =
  | { ok: true }
  | { ok: false; reason: "missing" | "mismatch" };

/**
 * Ensure recovery verification targets a consistent historyEntryId ↔
 * optimizationId association across the route, history entry, and pending
 * recovery slot (when present). Mismatches must fail closed before detection.
 */
export function resolveRecoveryVerificationAssociation(
  optimizationId: OptimizationId,
  historyEntryId: string | undefined
): RecoveryVerificationAssociation {
  if (!historyEntryId?.trim()) {
    return { ok: false, reason: "missing" };
  }

  const historyEntry = WindowsOptimizationService.getHistoryEntry(historyEntryId);
  const pendingRecoveryResult = readPendingRecoveryResult(historyEntryId);

  if (!historyEntry && !pendingRecoveryResult) {
    return { ok: false, reason: "missing" };
  }

  if (historyEntry && historyEntry.optimizationId !== optimizationId) {
    return { ok: false, reason: "mismatch" };
  }

  if (pendingRecoveryResult) {
    if (pendingRecoveryResult.historyEntryId !== historyEntryId) {
      return { ok: false, reason: "mismatch" };
    }

    if (pendingRecoveryResult.optimizationId !== optimizationId) {
      return { ok: false, reason: "mismatch" };
    }
  }

  return { ok: true };
}
