import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  resetPendingRecoveryRuntimeForTests,
  storePendingRecoveryResult,
  WindowsOptimizationService,
  type OptimizationHistoryEntry,
  type OptimizationRecoveryResult
} from "../../windows/WindowsOptimizationService";
import { resolveRecoveryVerificationAssociation } from "./RecoveryVerificationSupport";

function buildHistoryEntry(overrides: Partial<OptimizationHistoryEntry> = {}): OptimizationHistoryEntry {
  return {
    id: "entry-1",
    optimizationId: "windows-search",
    optimizationName: "Windows Search",
    previousState: "Running",
    newState: "Disabled",
    previousStartupType: "Automatic",
    timestamp: "1700000000",
    status: "Success",
    message: "Applied.",
    isAdmin: true,
    applyMode: "real",
    recoveryStatus: "Success",
    ...overrides
  };
}

function buildRecoveryResult(overrides: Partial<OptimizationRecoveryResult> = {}): OptimizationRecoveryResult {
  return {
    historyEntryId: "entry-1",
    optimizationId: "windows-search",
    status: "success",
    previousState: "Disabled",
    expectedState: "Running",
    actualState: "Running",
    message: "Restored.",
    error: null,
    timestamp: "1700000001",
    ...overrides
  };
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetPendingRecoveryRuntimeForTests();
});

afterEach(() => {
  resetPendingRecoveryRuntimeForTests();
});

describe("resolveRecoveryVerificationAssociation", () => {
  it("accepts a matching history entry and pending recovery for the route optimization id", () => {
    WindowsOptimizationService.recordHistory(buildHistoryEntry());
    storePendingRecoveryResult(buildRecoveryResult());

    expect(resolveRecoveryVerificationAssociation("windows-search", "entry-1")).toEqual({ ok: true });
  });

  it("accepts history-only recovery success for the matching optimization id", () => {
    WindowsOptimizationService.recordHistory(buildHistoryEntry({ recoveryStatus: "Success" }));

    expect(resolveRecoveryVerificationAssociation("windows-search", "entry-1")).toEqual({ ok: true });
  });

  it("accepts pending-only recovery for the matching optimization id", () => {
    storePendingRecoveryResult(buildRecoveryResult());

    expect(resolveRecoveryVerificationAssociation("windows-search", "entry-1")).toEqual({ ok: true });
  });

  it("reports missing when history id is empty or neither history nor pending exists", () => {
    expect(resolveRecoveryVerificationAssociation("windows-search", "")).toEqual({
      ok: false,
      reason: "missing"
    });
    expect(resolveRecoveryVerificationAssociation("windows-search", "entry-missing")).toEqual({
      ok: false,
      reason: "missing"
    });
  });

  it("reports mismatch when the history entry belongs to a different optimization", () => {
    WindowsOptimizationService.recordHistory(
      buildHistoryEntry({ optimizationId: "sysmain", optimizationName: "SysMain" })
    );
    storePendingRecoveryResult(buildRecoveryResult({ optimizationId: "windows-search" }));

    expect(resolveRecoveryVerificationAssociation("windows-search", "entry-1")).toEqual({
      ok: false,
      reason: "mismatch"
    });
  });

  it("reports mismatch when pending recovery belongs to a different optimization", () => {
    WindowsOptimizationService.recordHistory(buildHistoryEntry());
    storePendingRecoveryResult(buildRecoveryResult({ optimizationId: "sysmain" }));

    expect(resolveRecoveryVerificationAssociation("windows-search", "entry-1")).toEqual({
      ok: false,
      reason: "mismatch"
    });
  });

  it("reports mismatch when the route optimization id does not match history or pending", () => {
    WindowsOptimizationService.recordHistory(buildHistoryEntry());
    storePendingRecoveryResult(buildRecoveryResult());

    expect(resolveRecoveryVerificationAssociation("sysmain", "entry-1")).toEqual({
      ok: false,
      reason: "mismatch"
    });
  });
});
