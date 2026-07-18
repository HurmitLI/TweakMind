import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VerificationExecutionResult } from "../execution/OptimizationExecutionTypes";
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
});
