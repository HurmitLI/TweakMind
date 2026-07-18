import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  translateReportHeroExecutionMinutes,
  translateReportHeroImpact,
  translateReportHeroRisk,
  translateReportStoredExecutionTime,
  translateReportStoredImpact,
  translateReportStoredRisk
} from "./localizationHelpers";
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

describe("report hero localization", () => {
  beforeEach(() => {
    stubMatchMedia();
    SettingsService.updateSettings({ language: "en" });
  });

  afterEach(() => {
    SettingsService.updateSettings({ language: "en" });
  });

  it("localizes derived hero levels and pending execution without hardcoded Medium/Low/3 min", () => {
    expect(translateReportHeroImpact("High")).toBe("High");
    expect(translateReportHeroRisk("High")).toBe("High");
    expect(translateReportHeroExecutionMinutes(5)).toBe("About 5 minutes");
    expect(translateReportHeroImpact("Unknown")).toBe("Unknown");
    expect(translateReportHeroRisk("Unknown")).toBe("Unknown");
    expect(translateReportHeroExecutionMinutes(null)).toBe("Pending evaluation");
    expect(translateReportHeroExecutionMinutes(null)).not.toBe("3 min");
    expect(translateReportHeroImpact("Unknown")).not.toBe("Medium");
    expect(translateReportHeroRisk("Unknown")).not.toBe("Low");

    SettingsService.updateSettings({ language: "zh-CN" });
    expect(translateReportHeroImpact("High")).toBe("高");
    expect(translateReportHeroRisk("High")).toBe("高");
    expect(translateReportHeroExecutionMinutes(5)).toBe("大约 5 分钟");
    expect(translateReportHeroImpact("Unknown")).toBe("未知");
    expect(translateReportHeroRisk("Unknown")).toBe("未知");
    expect(translateReportHeroExecutionMinutes(null)).toBe("待评估");
  });

  it("treats legacy stored placeholder scan fields as pending evaluation", () => {
    expect(translateReportStoredImpact(undefined)).toBe("Pending evaluation");
    expect(translateReportStoredImpact("Unknown")).toBe("Pending evaluation");
    expect(translateReportStoredRisk(undefined)).toBe("Pending evaluation");
    expect(translateReportStoredRisk("Unknown")).toBe("Pending evaluation");
    expect(translateReportStoredExecutionTime(undefined)).toBe("Pending evaluation");
    expect(translateReportStoredExecutionTime("Unknown")).toBe("Pending evaluation");
    expect(translateReportStoredExecutionTime("3 min")).toBe("Pending evaluation");
  });
});
