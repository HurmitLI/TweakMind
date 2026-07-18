import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ApplyExecutionResult,
  RecoveryExecutionResult
} from "../execution/OptimizationExecutionTypes";
import { LocalizationService } from "../localization/LocalizationService";
import { SettingsService } from "../settings/SettingsService";
import type { OptimizationHistoryEntry } from "../windows/WindowsOptimizationService";
import { ErrorPresentationService, type ErrorType } from "./ErrorPresentationService";

function stubMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
}

function buildApplyResult(overrides: Partial<ApplyExecutionResult> = {}): ApplyExecutionResult {
  return {
    optimizationId: "windows-search",
    status: "success",
    applyMode: "real",
    previousState: "Running",
    currentState: "Disabled",
    previousStartupType: "Automatic",
    message: "Applied.",
    error: null,
    timestamp: "1700000000",
    ...overrides
  };
}

function buildRecoveryResult(overrides: Partial<RecoveryExecutionResult> = {}): RecoveryExecutionResult {
  return {
    optimizationId: "windows-search",
    historyEntryId: "entry-1",
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

describe("classifyTechnicalMessage", () => {
  const cases: Array<[string, ErrorType]> = [
    ["Administrator privileges are required to change this service.", "administrator-required"],
    ["Write failed with Windows error 5.", "administrator-required"],
    ["Windows Search apply is only available in the Tauri desktop app.", "unsupported-runtime"],
    ["Real apply is not available for this optimization yet.", "unsupported-optimization"],
    ["HAGS detection is not available yet.", "unsupported-optimization"],
    ["Scan failed for this optimization.", "scan-failed"],
    ["Scan failed unexpectedly.", "scan-failed"],
    ["Open HKEY_LOCAL_MACHINE subkey failed.", "windows-api-failed"],
    ["Registry value could not be written.", "windows-api-failed"],
    ["PowerSetActiveScheme returned an error.", "windows-api-failed"],
    ["Service Control Manager rejected the request.", "windows-api-failed"],
    ["Something completely unexpected happened.", "unknown-error"]
  ];

  it.each(cases)("classifies %j as %s", (message, expected) => {
    expect(ErrorPresentationService.classifyTechnicalMessage(message)).toBe(expected);
  });

  it("treats empty and missing messages as unknown errors", () => {
    expect(ErrorPresentationService.classifyTechnicalMessage("")).toBe("unknown-error");
    expect(ErrorPresentationService.classifyTechnicalMessage("   ")).toBe("unknown-error");
    expect(ErrorPresentationService.classifyTechnicalMessage(null)).toBe("unknown-error");
    expect(ErrorPresentationService.classifyTechnicalMessage(undefined)).toBe("unknown-error");
  });

  it("prefers the administrator classification over generic Windows API patterns", () => {
    expect(
      ErrorPresentationService.classifyTechnicalMessage("Registry write failed: administrator privileges are required.")
    ).toBe("administrator-required");
  });
});

describe("fromTechnicalError", () => {
  it("produces a retryable descriptor for Windows API failures", () => {
    const descriptor = ErrorPresentationService.fromTechnicalError("Registry write failed.", "apply");

    expect(descriptor.type).toBe("windows-api-failed");
    expect(descriptor.retryAvailable).toBe(true);
    expect(descriptor.title.length).toBeGreaterThan(0);
    expect(descriptor.recommendedAction.length).toBeGreaterThan(0);
  });

  it("marks administrator errors as non-retryable", () => {
    const descriptor = ErrorPresentationService.fromTechnicalError("Administrator privileges are required.", "apply");

    expect(descriptor.type).toBe("administrator-required");
    expect(descriptor.retryAvailable).toBe(false);
  });

  it("honors an explicit type override", () => {
    const descriptor = ErrorPresentationService.fromTechnicalError("Registry write failed.", "recovery", {
      type: "recovery-failed"
    });

    expect(descriptor.type).toBe("recovery-failed");
  });
});

describe("fromApplyResult", () => {
  it("returns null for successful applies", () => {
    expect(ErrorPresentationService.fromApplyResult(buildApplyResult())).toBeNull();
  });

  it("maps unsupported applies outside Tauri to unsupported-runtime", () => {
    const descriptor = ErrorPresentationService.fromApplyResult(
      buildApplyResult({ status: "unsupported", applyMode: "unsupported" })
    );

    expect(descriptor?.type).toBe("unsupported-runtime");
  });

  it("classifies failed applies from their technical error", () => {
    const descriptor = ErrorPresentationService.fromApplyResult(
      buildApplyResult({ status: "failed", error: "Windows error 5: access is denied." })
    );

    expect(descriptor?.type).toBe("administrator-required");
  });
});

describe("fromRecoveryResult", () => {
  it("returns null for successful recoveries", () => {
    expect(ErrorPresentationService.fromRecoveryResult(buildRecoveryResult())).toBeNull();
  });

  it("always presents failed recoveries as recovery-failed", () => {
    const descriptor = ErrorPresentationService.fromRecoveryResult(
      buildRecoveryResult({ status: "failed", error: "Registry write failed." })
    );

    expect(descriptor?.type).toBe("recovery-failed");
    expect(descriptor?.retryAvailable).toBe(true);
  });
});

describe("forHistoryEntry", () => {
  it("returns null for fully successful entries", () => {
    expect(ErrorPresentationService.forHistoryEntry(buildHistoryEntry())).toBeNull();
  });

  it("prioritizes recovery failures over verification failures", () => {
    const descriptor = ErrorPresentationService.forHistoryEntry(
      buildHistoryEntry({ recoveryStatus: "Failed", verificationStatus: "Failed" })
    );

    expect(descriptor?.type).toBe("recovery-failed");
  });

  it("reports verification failures when recovery did not fail", () => {
    const descriptor = ErrorPresentationService.forHistoryEntry(buildHistoryEntry({ verificationStatus: "Failed" }));

    expect(descriptor?.type).toBe("verification-failed");
  });

  it("classifies failed apply entries from their recorded message", () => {
    const descriptor = ErrorPresentationService.forHistoryEntry(
      buildHistoryEntry({ status: "Failed", message: "Administrator privileges are required." })
    );

    expect(descriptor?.type).toBe("administrator-required");
  });
});

describe("forApplyUnavailable", () => {
  it("returns null when real apply is available", () => {
    expect(ErrorPresentationService.forApplyUnavailable(true)).toBeNull();
  });

  it("reports unsupported-runtime outside the Tauri desktop app", () => {
    expect(ErrorPresentationService.forApplyUnavailable(false)?.type).toBe("unsupported-runtime");
  });
});

describe("runtime localization for scan and common error actions", () => {
  beforeEach(() => {
    stubMatchMedia();
  });

  afterEach(() => {
    SettingsService.updateSettings({ language: "en" });
  });

  it("uses scan-failed translation keys instead of hardcoded English", () => {
    SettingsService.updateSettings({ language: "en" });
    const english = ErrorPresentationService.fromTechnicalError("Scan failed unexpectedly.", "scan", {
      type: "scan-failed"
    });

    expect(english.title).toBe(LocalizationService.translate("error.scanFailed.title"));
    expect(english.explanation).toBe(LocalizationService.translate("error.scanFailed.explanation"));
    expect(english.recommendedAction).toBe(LocalizationService.translate("error.scanFailed.action"));
    expect(english.title).not.toBe("Something Went Wrong");
    expect(english.title).not.toBe("Scan Required");

    SettingsService.updateSettings({ language: "zh-CN" });
    const chinese = ErrorPresentationService.fromTechnicalError("Scan failed unexpectedly.", "scan", {
      type: "scan-failed"
    });

    expect(chinese.title).toBe("扫描失败");
    expect(chinese.explanation).toContain("未能完成系统扫描");
    expect(chinese.recommendedAction).toContain("重试扫描");
    expect(chinese.title).not.toBe(english.title);
  });

  it("keeps forScanRequired on the scan-required copy after language switches", () => {
    SettingsService.updateSettings({ language: "zh-CN" });
    const descriptor = ErrorPresentationService.forScanRequired();

    expect(descriptor.type).toBe("scan-failed");
    expect(descriptor.title).toBe("需要扫描");
    expect(descriptor.explanation).toContain("最新扫描结果");
    expect(descriptor.recommendedAction).toContain("运行扫描");
  });

  it("localizes common error action labels through translation keys", () => {
    SettingsService.updateSettings({ language: "zh-CN" });

    expect(LocalizationService.translate("common.action.retry")).toBe("重试");
    expect(LocalizationService.translate("common.action.goBack")).toBe("返回");
    expect(LocalizationService.translate("common.action.openHistory")).toBe("打开历史记录");
    expect(LocalizationService.translate("error.recommendedActionPrefix")).not.toBe("Recommended action:");
  });
});
