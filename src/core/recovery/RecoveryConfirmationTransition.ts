import {
  clearPendingRecoveryResult,
  storePendingRecoveryAuthorization
} from "../windows/WindowsOptimizationService";

export type RecoveryConfirmationTransitionResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" }
  | { ok: false; reason: "authorization"; errorMessage: string };

const inFlightHistoryEntryIds = new Set<string>();

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const asString = String(error ?? "").trim();
  return asString || "Failed to store recovery authorization.";
}

/** Test-only: clear synchronous in-flight gates between cases. */
export function resetRecoveryConfirmationTransitionForTests(): void {
  inFlightHistoryEntryIds.clear();
}

export function isRecoveryConfirmationTransitionInFlight(historyEntryId: string): boolean {
  return inFlightHistoryEntryIds.has(historyEntryId);
}

/**
 * Atomically prepare navigation from RecoveryConfirmation → RecoveryPage.
 *
 * Authorization must be written successfully before the matching pending
 * recovery slot is consumed. On authorization failure, pending is left intact
 * and the caller must not navigate.
 */
export function beginRecoveryConfirmationTransition(
  historyEntryId: string
): RecoveryConfirmationTransitionResult {
  if (!historyEntryId.trim()) {
    return {
      ok: false,
      reason: "authorization",
      errorMessage: "Missing history entry id for recovery confirmation."
    };
  }

  if (inFlightHistoryEntryIds.has(historyEntryId)) {
    return { ok: false, reason: "duplicate" };
  }

  inFlightHistoryEntryIds.add(historyEntryId);

  try {
    // 1) Gate first — never clear pending if this throws.
    storePendingRecoveryAuthorization(historyEntryId);

    // 2) Consume only the matched pending slot after authorization succeeds.
    try {
      clearPendingRecoveryResult(historyEntryId);
    } catch {
      // Auth already granted; RecoveryPage onStartFresh clears the matched slot again.
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: "authorization",
      errorMessage: toErrorMessage(error)
    };
  } finally {
    inFlightHistoryEntryIds.delete(historyEntryId);
  }
}
