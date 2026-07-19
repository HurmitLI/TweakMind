import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isApplyConfirmationInFlight,
  resetApplyConfirmationLifecycleForTests,
  startApplyConfirmationLifecycle
} from "../apply/ApplyConfirmationLifecycle";
import type { ApplyExecutionResult, RecoveryExecutionResult } from "../execution/OptimizationExecutionTypes";
import { OptimizationExecutor } from "./OptimizationExecutor";
import type { OptimizationHistoryEntry } from "./WindowsOptimizationService";
import {
  optimizationHistoryStorageKey,
  resetPendingApplyRuntimeForTests,
  storePendingApplyResult,
  WindowsOptimizationService
} from "./WindowsOptimizationService";

const recoverMock = vi.hoisted(() => vi.fn());
const applyMock = vi.hoisted(() => vi.fn());

vi.mock("../plugins/OptimizationPluginManager", () => ({
  OptimizationPluginManager: {
    apply: applyMock,
    recover: recoverMock
  }
}));

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
    ...overrides
  };
}

function buildApplyResult(overrides: Partial<ApplyExecutionResult> = {}): ApplyExecutionResult {
  return {
    historyEntryId: "pending",
    optimizationId: "windows-search",
    applyMode: "real",
    status: "success",
    previousState: "Running",
    currentState: "Disabled",
    message: "Applied.",
    error: null,
    timestamp: "1700000000",
    ...overrides
  };
}

function buildRecoveryResult(overrides: Partial<RecoveryExecutionResult> = {}): RecoveryExecutionResult {
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

function denyHistoryWrites() {
  const originalSetItem = Storage.prototype.setItem;
  return vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (this === window.localStorage && key === optimizationHistoryStorageKey) {
      throw new Error("QuotaExceededError");
    }

    return originalSetItem.call(this, key, value);
  });
}

beforeEach(() => {
  recoverMock.mockReset();
  applyMock.mockReset();
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetApplyConfirmationLifecycleForTests();
  resetPendingApplyRuntimeForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetApplyConfirmationLifecycleForTests();
  resetPendingApplyRuntimeForTests();
});

describe("OptimizationExecutor.apply", () => {
  it("records history and returns the stamped historyEntryId on success", async () => {
    applyMock.mockResolvedValue(buildApplyResult());

    const result = await OptimizationExecutor.apply("windows-search");

    expect(result.status).toBe("success");
    expect(result.historyEntryId).toEqual(expect.any(String));
    expect(WindowsOptimizationService.getHistoryEntry(result.historyEntryId as string)?.optimizationId).toBe(
      "windows-search"
    );
  });

  it("still resolves a successful apply when history localStorage write fails", async () => {
    applyMock.mockResolvedValue(buildApplyResult({ message: "Native applied." }));
    denyHistoryWrites();

    await expect(OptimizationExecutor.apply("windows-search")).resolves.toEqual(
      expect.objectContaining({
        status: "success",
        optimizationId: "windows-search",
        message: "Native applied.",
        historyEntryId: expect.any(String)
      })
    );

    expect(WindowsOptimizationService.getHistory()).toEqual([]);
    expect(applyMock).toHaveBeenCalledTimes(1);
  });

  it("still resolves a failed apply when history localStorage write fails", async () => {
    applyMock.mockResolvedValue(
      buildApplyResult({
        status: "failed",
        message: undefined,
        error: "Access denied",
        currentState: "Running"
      })
    );
    denyHistoryWrites();

    const result = await OptimizationExecutor.apply("windows-search");

    expect(result.status).toBe("failed");
    expect(result.error).toBe("Access denied");
    expect(result.historyEntryId).toBeTruthy();
    expect(WindowsOptimizationService.getHistory()).toEqual([]);
  });

  it("does not present post-native history write failure as Confirm UI failure or keep inflight", async () => {
    applyMock.mockResolvedValue(buildApplyResult({ message: "Native applied." }));
    denyHistoryWrites();

    const onUiSuccess = vi.fn();
    const onUiFailure = vi.fn();
    const handle = startApplyConfirmationLifecycle({
      optimizationId: "windows-search",
      runApply: () => OptimizationExecutor.apply("windows-search"),
      persistResult: storePendingApplyResult,
      onUiSuccess,
      onUiFailure
    });

    await vi.waitFor(() => {
      expect(handle.getStatus()).toBe("succeeded");
    });

    expect(onUiSuccess).toHaveBeenCalledTimes(1);
    expect(onUiSuccess.mock.calls[0][0].historyEntryId).toBeTruthy();
    expect(onUiFailure).not.toHaveBeenCalled();
    expect(isApplyConfirmationInFlight("windows-search")).toBe(false);
    expect(applyMock).toHaveBeenCalledTimes(1);
  });
});

describe("OptimizationExecutor.restore", () => {
  it("passes successful plugin recoveries through and records them", async () => {
    const entry = WindowsOptimizationService.recordHistory(buildHistoryEntry());
    recoverMock.mockResolvedValue(buildRecoveryResult({ historyEntryId: entry.id }));

    const result = await OptimizationExecutor.restore(entry);

    expect(result.status).toBe("success");
    expect(WindowsOptimizationService.getHistoryEntry(entry.id)?.recoveryStatus).toBe("Success");
  });

  it("resolves with a failed result instead of rejecting when the plugin throws", async () => {
    const entry = WindowsOptimizationService.recordHistory(buildHistoryEntry());
    recoverMock.mockRejectedValue(new Error("ipc channel closed"));

    const result = await OptimizationExecutor.restore(entry);

    expect(result.status).toBe("failed");
    expect(result.historyEntryId).toBe(entry.id);
    expect(result.optimizationId).toBe(entry.optimizationId);
    expect(result.expectedState).toBe(entry.previousState);
    expect(result.actualState).toBe("Unknown");
    expect(result.error).toContain("Recovery failed");
    expect(result.error).toContain("ipc channel closed");
  });

  it("records the unexpected failure on the history entry", async () => {
    const entry = WindowsOptimizationService.recordHistory(buildHistoryEntry());
    recoverMock.mockRejectedValue("recover handler missing");

    await OptimizationExecutor.restore(entry);

    const updated = WindowsOptimizationService.getHistoryEntry(entry.id);
    expect(updated?.recoveryStatus).toBe("Failed");
    expect(updated?.recoveryMessage).toContain("recover handler missing");
  });

  it("still resolves a successful restore when recovery history write fails", async () => {
    const entry = WindowsOptimizationService.recordHistory(buildHistoryEntry());
    recoverMock.mockResolvedValue(buildRecoveryResult({ historyEntryId: entry.id, message: "Native restored." }));
    denyHistoryWrites();

    await expect(OptimizationExecutor.restore(entry)).resolves.toEqual(
      expect.objectContaining({
        status: "success",
        historyEntryId: entry.id,
        message: "Native restored."
      })
    );

    // Pre-existing entry remains; recoveryStatus may be unchanged when the update write fails.
    expect(WindowsOptimizationService.getHistoryEntry(entry.id)?.id).toBe(entry.id);
    expect(recoverMock).toHaveBeenCalledTimes(1);
  });

  it("still resolves a failed restore when recovery history write fails", async () => {
    const entry = WindowsOptimizationService.recordHistory(buildHistoryEntry());
    recoverMock.mockRejectedValue(new Error("native restore denied"));
    denyHistoryWrites();

    const result = await OptimizationExecutor.restore(entry);

    expect(result.status).toBe("failed");
    expect(result.historyEntryId).toBe(entry.id);
    expect(result.error).toContain("native restore denied");
  });
});
