import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorPresentationService } from "../error/ErrorPresentationService";
import { detectWithNativeCommand } from "./NativeDetection";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock
}));

function enableTauriRuntime() {
  (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
}

function disableTauriRuntime() {
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
}

beforeEach(() => {
  invokeMock.mockReset();
});

afterEach(() => {
  disableTauriRuntime();
});

describe("detectWithNativeCommand outside the Tauri runtime", () => {
  it("soft-fails without calling invoke", async () => {
    const result = await detectWithNativeCommand("detect_windows_search", "Windows Search");

    expect(result.success).toBe(false);
    expect(result.status).toBe("Failed");
    expect(result.previousState).toBe("Unknown");
    expect(result.currentState).toBe("Unknown");
    expect(result.message).toContain("only available in the Tauri desktop app");
    expect(invokeMock).not.toHaveBeenCalled();
  });
});

describe("detectWithNativeCommand inside the Tauri runtime", () => {
  beforeEach(() => {
    enableTauriRuntime();
  });

  it("maps a successful native result", async () => {
    invokeMock.mockResolvedValue({
      success: true,
      status: "Success",
      previous_state: "Running",
      current_state: "Running",
      message: "WSearch is running.",
      timestamp: "1700000000"
    });

    const result = await detectWithNativeCommand("detect_windows_search", "Windows Search");

    expect(invokeMock).toHaveBeenCalledWith("detect_windows_search");
    expect(result).toEqual({
      success: true,
      status: "Success",
      previousState: "Running",
      currentState: "Running",
      message: "WSearch is running.",
      timestamp: "1700000000"
    });
  });

  it("resolves with a predictable failure when invoke rejects with an Error", async () => {
    invokeMock.mockRejectedValue(new Error("command detect_windows_search not found"));

    const result = await detectWithNativeCommand("detect_windows_search", "Windows Search");

    expect(result.success).toBe(false);
    expect(result.status).toBe("Failed");
    expect(result.previousState).toBe("Unknown");
    expect(result.currentState).toBe("Unknown");
    expect(result.message).toContain("Windows Search detection failed");
    expect(result.message).toContain("command detect_windows_search not found");
    expect(Number(result.timestamp)).toBeGreaterThan(0);
  });

  it("resolves with a predictable failure when invoke rejects with a plain string", async () => {
    invokeMock.mockRejectedValue("ipc channel closed");

    const result = await detectWithNativeCommand("detect_game_mode", "Game Mode");

    expect(result.success).toBe(false);
    expect(result.message).toContain("Game Mode detection failed");
    expect(result.message).toContain("ipc channel closed");
  });

  it("resolves with a predictable failure when invoke rejects with an object", async () => {
    invokeMock.mockRejectedValue({ code: 5 });

    const result = await detectWithNativeCommand("detect_hags", "HAGS");

    expect(result.success).toBe(false);
    expect(result.message).toContain("HAGS detection failed");
    expect(result.message).toContain('{"code":5}');
  });

  it("produces a message the error presentation layer classifies as a Windows API failure", async () => {
    invokeMock.mockRejectedValue(new Error("ipc channel closed"));

    const result = await detectWithNativeCommand("detect_sysmain", "SysMain");

    expect(ErrorPresentationService.classifyTechnicalMessage(result.message)).toBe("windows-api-failed");
  });
});
