import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecoveryExecutionResult } from "../execution/OptimizationExecutionTypes";
import { OptimizationExecutor } from "./OptimizationExecutor";
import type { OptimizationHistoryEntry } from "./WindowsOptimizationService";
import { WindowsOptimizationService } from "./WindowsOptimizationService";

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

beforeEach(() => {
  recoverMock.mockReset();
  applyMock.mockReset();
  window.localStorage.clear();
  window.sessionStorage.clear();
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
});
