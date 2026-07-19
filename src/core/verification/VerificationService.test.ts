import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VerificationExecutionResult } from "../execution/OptimizationExecutionTypes";
import {
  readPendingApplyResult,
  storePendingApplyResult,
  type OptimizationApplyResult
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

beforeEach(() => {
  verifyMock.mockReset();
  window.localStorage.clear();
  window.sessionStorage.clear();
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
});
