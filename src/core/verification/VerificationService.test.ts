import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { VerificationExecutionResult } from "../execution/OptimizationExecutionTypes";
import {
  clearPendingRecoveryResult,
  pendingRecoveryResultStorageKey,
  readPendingApplyResult,
  readPendingRecoveryResult,
  resetPendingApplyRuntimeForTests,
  resetPendingRecoveryRuntimeForTests,
  storePendingApplyResult,
  storePendingRecoveryResult,
  type OptimizationApplyResult,
  type OptimizationRecoveryResult
} from "../windows/WindowsOptimizationService";
import { VerificationService } from "./VerificationService";

const verifyMock = vi.hoisted(() => vi.fn());

vi.mock("../plugins/OptimizationPluginManager", () => ({
  OptimizationPluginManager: {
    verify: verifyMock
  }
}));

function buildVerificationResult(overrides: Partial<VerificationExecutionResult> = {}): VerificationExecutionResult {
  return {
    historyEntryId: "entry-1",
    optimizationId: "windows-search",
    status: "Verified",
    previousState: "Running",
    expectedState: "Disabled",
    actualState: "Disabled",
    message: "Windows Search is now detected as Disabled.",
    timestamp: "1700000000",
    ...overrides
  };
}

function buildApplyResult(overrides: Partial<OptimizationApplyResult> = {}): OptimizationApplyResult {
  return {
    historyEntryId: "entry-1",
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
    timestamp: "1700000000",
    ...overrides
  };
}

beforeEach(() => {
  verifyMock.mockReset();
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetPendingApplyRuntimeForTests();
  resetPendingRecoveryRuntimeForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetPendingApplyRuntimeForTests();
  resetPendingRecoveryRuntimeForTests();
});

describe("VerificationService.verify", () => {
  it("passes successful plugin results through unchanged", async () => {
    verifyMock.mockResolvedValue(buildVerificationResult());

    const result = await VerificationService.verify("windows-search", { historyEntryId: "entry-1" });

    expect(result.status).toBe("Verified");
    expect(result.historyEntryId).toBe("entry-1");
    expect(verifyMock).toHaveBeenCalledWith("windows-search", {
      historyEntryId: "entry-1",
      verificationMode: "apply"
    });
  });

  it("resolves with a Failed result instead of rejecting when the plugin throws", async () => {
    verifyMock.mockRejectedValue(new Error("ipc channel closed"));

    const result = await VerificationService.verify("windows-search", { historyEntryId: "entry-1" });

    expect(result.status).toBe("Failed");
    expect(result.optimizationId).toBe("windows-search");
    expect(result.historyEntryId).toBe("entry-1");
    expect(result.previousState).toBe("Unknown");
    expect(result.expectedState).toBe("Unknown");
    expect(result.actualState).toBe("Unknown");
    expect(result.message).toContain("Verification failed");
    expect(result.message).toContain("ipc channel closed");
  });

  it("keeps the recovery verification mode when the plugin throws", async () => {
    verifyMock.mockRejectedValue("verify handler missing");

    const result = await VerificationService.verify("sysmain", { mode: "recovery", historyEntryId: "entry-2" });

    expect(verifyMock).toHaveBeenCalledWith("sysmain", {
      historyEntryId: "entry-2",
      verificationMode: "recovery"
    });
    expect(result.status).toBe("Failed");
    expect(result.message).toContain("verify handler missing");
  });

  it("clears the matching pending apply slot after a terminal apply verification", async () => {
    storePendingApplyResult(buildApplyResult({ historyEntryId: "entry-1" }));
    verifyMock.mockResolvedValue(buildVerificationResult({ status: "Failed", actualState: "Running" }));

    await VerificationService.verify("windows-search", { historyEntryId: "entry-1" });

    expect(readPendingApplyResult("windows-search")).toBeNull();
  });

  it("keeps pending apply when verification stays pending", async () => {
    storePendingApplyResult(buildApplyResult({ historyEntryId: "entry-1" }));
    verifyMock.mockResolvedValue(
      buildVerificationResult({
        status: "Pending / Not Available",
        message: "No completed Apply result was found. Verification is pending."
      })
    );

    await VerificationService.verify("windows-search", { historyEntryId: "entry-1" });

    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-1");
  });

  it("does not clear a pending apply that belongs to a different history entry", async () => {
    storePendingApplyResult(buildApplyResult({ historyEntryId: "entry-pending" }));
    verifyMock.mockResolvedValue(buildVerificationResult({ historyEntryId: "entry-other" }));

    await VerificationService.verify("windows-search", { historyEntryId: "entry-other" });

    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-pending");
  });

  it("clears matching pending apply when apply-mode plugin verification throws", async () => {
    storePendingApplyResult(buildApplyResult({ historyEntryId: "entry-1" }));
    verifyMock.mockRejectedValue(new Error("native invoke aborted"));

    const result = await VerificationService.verify("windows-search");

    expect(result.status).toBe("Failed");
    expect(result.historyEntryId).toBe("entry-1");
    expect(result.message).toContain("native invoke aborted");
    expect(readPendingApplyResult("windows-search")).toBeNull();
  });

  it("does not clear pending apply when recovery-mode plugin verification throws", async () => {
    storePendingApplyResult(buildApplyResult({ historyEntryId: "entry-1" }));
    verifyMock.mockRejectedValue(new Error("recovery verify crashed"));

    const result = await VerificationService.verify("windows-search", {
      mode: "recovery",
      historyEntryId: "entry-recovery"
    });

    expect(result.status).toBe("Failed");
    expect(result.historyEntryId).toBe("entry-recovery");
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-1");
  });

  it("isolates pending consumption across interleaved apply/verify for different optimizations", async () => {
    storePendingApplyResult(
      buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-search" })
    );
    storePendingApplyResult(
      buildApplyResult({ optimizationId: "sysmain", historyEntryId: "entry-sysmain", previousState: "Stopped" })
    );

    verifyMock.mockResolvedValue(
      buildVerificationResult({
        optimizationId: "windows-search",
        historyEntryId: "entry-search",
        status: "Verified"
      })
    );

    await VerificationService.verify("windows-search", { historyEntryId: "entry-search" });

    expect(readPendingApplyResult("windows-search")).toBeNull();
    expect(readPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-sysmain");
  });

  it("does not consume a pending apply for the wrong optimization id", async () => {
    storePendingApplyResult(
      buildApplyResult({ optimizationId: "sysmain", historyEntryId: "entry-sysmain" })
    );
    verifyMock.mockResolvedValue(
      buildVerificationResult({
        optimizationId: "windows-search",
        historyEntryId: "entry-search",
        status: "Verified"
      })
    );

    await VerificationService.verify("windows-search", { historyEntryId: "entry-search" });

    expect(readPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-sysmain");
    expect(readPendingApplyResult("windows-search")).toBeNull();
  });

  it("clears only the matching pending recovery slot after a terminal recovery verification", async () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-a", message: "A" }));
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-b", message: "B" }));
    verifyMock.mockResolvedValue(
      buildVerificationResult({
        historyEntryId: "entry-a",
        status: "Verified"
      })
    );

    await VerificationService.verify("windows-search", { mode: "recovery", historyEntryId: "entry-a" });

    expect(readPendingRecoveryResult("entry-a")).toBeNull();
    expect(readPendingRecoveryResult("entry-b")?.message).toBe("B");
  });

  it("does not clear pending recovery when verification targets a different history entry", async () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-pending", message: "Keep" }));
    verifyMock.mockResolvedValue(
      buildVerificationResult({
        historyEntryId: "entry-other",
        status: "Verified"
      })
    );

    await VerificationService.verify("windows-search", { mode: "recovery", historyEntryId: "entry-other" });

    expect(readPendingRecoveryResult("entry-pending")?.message).toBe("Keep");
    expect(readPendingRecoveryResult("entry-other")).toBeNull();
  });

  it("keeps pending recovery when recovery verification stays pending", async () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-1" }));
    verifyMock.mockResolvedValue(
      buildVerificationResult({
        historyEntryId: "entry-1",
        status: "Pending / Not Available",
        message: "No completed Recovery result was found. Verification is pending."
      })
    );

    await VerificationService.verify("windows-search", { mode: "recovery", historyEntryId: "entry-1" });

    expect(readPendingRecoveryResult("entry-1")?.historyEntryId).toBe("entry-1");
  });

  it("does not consume pending when commitSideEffects is false until commitVerification runs", async () => {
    storePendingApplyResult(buildApplyResult({ historyEntryId: "entry-1" }));
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-recovery" }));
    verifyMock.mockResolvedValue(buildVerificationResult({ historyEntryId: "entry-1", status: "Verified" }));

    const result = await VerificationService.verify("windows-search", {
      historyEntryId: "entry-1",
      commitSideEffects: false
    });

    expect(result.status).toBe("Verified");
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-1");
    expect(readPendingRecoveryResult("entry-recovery")?.historyEntryId).toBe("entry-recovery");

    VerificationService.commitVerification("windows-search", "apply", result);

    expect(readPendingApplyResult("windows-search")).toBeNull();
    expect(readPendingRecoveryResult("entry-recovery")?.historyEntryId).toBe("entry-recovery");
  });

  it("stale discarded verify without commit leaves matching pending slots intact", async () => {
    storePendingApplyResult(buildApplyResult({ historyEntryId: "entry-a" }));
    storePendingApplyResult(
      buildApplyResult({ optimizationId: "sysmain", historyEntryId: "entry-b", previousState: "Stopped" })
    );
    verifyMock.mockResolvedValue(
      buildVerificationResult({
        optimizationId: "windows-search",
        historyEntryId: "entry-a",
        status: "Verified"
      })
    );

    const stale = await VerificationService.verify("windows-search", {
      historyEntryId: "entry-a",
      commitSideEffects: false
    });

    // Simulate VerificationPage dispose: never commit the stale attempt.
    expect(stale.historyEntryId).toBe("entry-a");
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-a");
    expect(readPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-b");
  });

  it("does not consume a stale session recovery pending when only local persist succeeded with a fresh result", async () => {
    const stale = buildRecoveryResult({ historyEntryId: "entry-1", message: "StaleSession" });
    window.sessionStorage.setItem(pendingRecoveryResultStorageKey, JSON.stringify({ "entry-1": stale }));

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.sessionStorage && key === pendingRecoveryResultStorageKey) {
        throw new Error("QuotaExceededError");
      }

      return originalSetItem.call(this, key, value);
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === window.sessionStorage && key === pendingRecoveryResultStorageKey) {
        throw new Error("session remove blocked");
      }

      return originalRemoveItem.call(this, key);
    });

    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-1", message: "FreshLocal" }));
    expect(readPendingRecoveryResult("entry-1")?.message).toBe("FreshLocal");

    verifyMock.mockResolvedValue(
      buildVerificationResult({
        historyEntryId: "entry-1",
        status: "Verified",
        message: "Verified fresh recovery."
      })
    );

    const result = await VerificationService.verify("windows-search", {
      mode: "recovery",
      historyEntryId: "entry-1"
    });

    expect(result.status).toBe("Verified");
    expect(result.message).toBe("Verified fresh recovery.");
    expect(readPendingRecoveryResult("entry-1")).toBeNull();
  });

  it("keeps other history ids after verify clear when rewrite/remove both fail for the matched slot", async () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-a", message: "A" }));
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-b", message: "B" }));

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (key === pendingRecoveryResultStorageKey) {
        throw new Error("rewrite denied");
      }

      return originalSetItem.call(this, key, value);
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (key === pendingRecoveryResultStorageKey) {
        throw new Error("remove denied");
      }

      return originalRemoveItem.call(this, key);
    });

    verifyMock.mockResolvedValue(
      buildVerificationResult({
        historyEntryId: "entry-a",
        status: "Verified"
      })
    );

    await VerificationService.verify("windows-search", { mode: "recovery", historyEntryId: "entry-a" });

    expect(readPendingRecoveryResult("entry-a")).toBeNull();
    expect(readPendingRecoveryResult("entry-b")?.message).toBe("B");
    // Physical leftovers must not resurrect the cleared slot for a later read.
    expect(window.sessionStorage.getItem(pendingRecoveryResultStorageKey)).toContain("entry-a");
    clearPendingRecoveryResult("entry-b");
    expect(readPendingRecoveryResult("entry-b")).toBeNull();
  });
});
