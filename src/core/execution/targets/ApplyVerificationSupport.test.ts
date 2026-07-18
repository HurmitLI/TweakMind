import { beforeEach, describe, expect, it } from "vitest";
import {
  storePendingApplyResult,
  WindowsOptimizationService,
  type OptimizationApplyResult,
  type OptimizationHistoryEntry
} from "../../windows/WindowsOptimizationService";
import { resolveApplyVerificationSource } from "./ApplyVerificationSupport";

function buildHistoryEntry(overrides: Partial<OptimizationHistoryEntry> = {}): OptimizationHistoryEntry {
  return {
    id: "entry-old",
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
    ...overrides
  };
}

function buildApplyResult(overrides: Partial<OptimizationApplyResult> = {}): OptimizationApplyResult {
  return {
    historyEntryId: "entry-new",
    optimizationId: "windows-search",
    applyMode: "real",
    status: "success",
    previousState: "Stopped",
    currentState: "Disabled",
    message: "Applied.",
    error: null,
    timestamp: "1700000100",
    ...overrides
  };
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("resolveApplyVerificationSource", () => {
  it("prefers an explicit history entry over a newer pending apply slot", () => {
    WindowsOptimizationService.recordHistory(buildHistoryEntry());
    storePendingApplyResult(
      buildApplyResult({
        historyEntryId: "entry-new",
        status: "failed",
        previousState: "Running",
        currentState: "Running"
      })
    );

    const resolution = resolveApplyVerificationSource("windows-search", "Disabled", "entry-old");

    expect(resolution).toEqual({
      ok: true,
      source: {
        previousState: "Running",
        expectedState: "Disabled",
        historyEntryId: "entry-old"
      }
    });
  });

  it("uses the pending apply result when no history entry id is provided", () => {
    storePendingApplyResult(buildApplyResult({ previousState: "Stopped" }));

    const resolution = resolveApplyVerificationSource("windows-search", "Disabled");

    expect(resolution).toEqual({
      ok: true,
      source: {
        previousState: "Stopped",
        expectedState: "Disabled",
        historyEntryId: "entry-new"
      }
    });
  });

  it("does not let a failed pending apply block history-targeted verification", () => {
    WindowsOptimizationService.recordHistory(buildHistoryEntry({ id: "entry-success" }));
    storePendingApplyResult(
      buildApplyResult({
        historyEntryId: "entry-failed",
        status: "failed"
      })
    );

    const resolution = resolveApplyVerificationSource("windows-search", "Disabled", "entry-success");

    expect(resolution.ok).toBe(true);
    if (resolution.ok) {
      expect(resolution.source.historyEntryId).toBe("entry-success");
    }
  });

  it("reports missing when neither pending apply nor history can be resolved", () => {
    expect(resolveApplyVerificationSource("windows-search", "Disabled")).toEqual({
      ok: false,
      reason: "missing"
    });
    expect(resolveApplyVerificationSource("windows-search", "Disabled", "missing-entry")).toEqual({
      ok: false,
      reason: "missing"
    });
  });
});
