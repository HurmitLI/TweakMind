import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { translateOptimizationStatus } from "./localizationHelpers";
import { LocalizationService } from "./LocalizationService";
import { translateRuntimeMessage } from "./RuntimeMessageLocalizationService";
import { SettingsService } from "../settings/SettingsService";

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

describe("RuntimeMessageLocalizationService language switching", () => {
  beforeEach(() => {
    stubMatchMedia();
  });

  afterEach(() => {
    SettingsService.updateSettings({ language: "en" });
  });

  it("translates scan hard-failure tokens from keys instead of leaving English", () => {
    SettingsService.updateSettings({ language: "en" });
    expect(translateRuntimeMessage("Scan failed unexpectedly.")).toBe(
      LocalizationService.translate("runtime.scan.unexpectedFailure")
    );
    expect(translateRuntimeMessage("Unable to determine the current Windows state. Please retry scanning or check permissions.")).toBe(
      LocalizationService.translate("runtime.scan.stateUnknown")
    );

    SettingsService.updateSettings({ language: "zh-CN" });
    expect(translateRuntimeMessage("Scan failed unexpectedly.")).toBe("扫描意外失败。");
    expect(
      translateRuntimeMessage(
        "Unable to determine the current Windows state. Please retry scanning or check permissions."
      )
    ).toBe("无法确定当前 Windows 状态。请重新扫描或检查权限。");
  });

  it("translates apply/verify/recovery runtime feedback after language switches", () => {
    SettingsService.updateSettings({ language: "zh-CN" });

    expect(translateRuntimeMessage("Optimization completed through the executor.")).toBe(
      "优化已通过执行器完成。"
    );
    expect(translateRuntimeMessage("Windows Search was disabled through the native Tauri executor.")).toBe(
      "Windows Search 已通过原生执行器禁用。"
    );
    expect(translateRuntimeMessage("Recovery finished.")).toBe(
      LocalizationService.translate("runtime.recovery.finished")
    );
  });

  it("localizes recovery confirmation state interpolations through status keys", () => {
    SettingsService.updateSettings({ language: "zh-CN" });

    expect(translateOptimizationStatus("Enabled")).toBe("已启用");
    expect(translateOptimizationStatus("Disabled")).toBe("已禁用");
    expect(translateOptimizationStatus("Running")).toBe("运行中");

    const body = LocalizationService.translate("recoveryConfirm.whatWillChange.body", {
      name: "Windows Search",
      state: translateOptimizationStatus("Disabled")
    });

    expect(body).toContain("已禁用");
    expect(body).not.toContain("state: Disabled");
    expect(body).not.toMatch(/\bDisabled\b/);
  });
});
