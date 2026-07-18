import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OptimizationId, OptimizationRecommendation } from "../../types/optimization";
import { LocalizationService } from "../localization/LocalizationService";
import type { RuntimeScanSnapshot, RuntimeScanStatus } from "../scan/RuntimeScanModel";
import type { OptimizationScanResult, ScanResult } from "../scan/ScanResult";
import { SettingsService } from "../settings/SettingsService";
import type { DecisionReportItem } from "./DecisionReportTypes";
import { DecisionReportService } from "./DecisionReportService";

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

function buildRuntimeScan(
  optimizationId: OptimizationId,
  runtimeScanStatus: RuntimeScanStatus = "Detected"
): RuntimeScanSnapshot {
  return {
    optimizationId,
    runtimeScanStatus,
    scanCapability: runtimeScanStatus === "Not Supported Yet" ? "Not Supported Yet" : "Native Detection",
    detectionMethod: "Test detection",
    currentRuntimeState: runtimeScanStatus === "Detected" ? "Running" : "Unknown",
    detectionConfidence: runtimeScanStatus === "Detected" ? "High" : "None",
    message: "Test detection message"
  };
}

function buildScanEntry(
  id: OptimizationId,
  recommendation: OptimizationRecommendation,
  runtimeScanStatus: RuntimeScanStatus = "Detected"
): OptimizationScanResult {
  return {
    id,
    definition: {} as OptimizationScanResult["definition"],
    rawDetectedValue: "Running",
    normalizedStatus: "Running",
    recommendation,
    reason: `${id} reason`,
    selectable: recommendation === "Recommended" || recommendation === "Optional",
    selectedByDefault: recommendation === "Recommended",
    runtimeScan: buildRuntimeScan(id, runtimeScanStatus)
  };
}

function buildScanResult(entries: OptimizationScanResult[]): ScanResult {
  return {
    timestamp: "1700000000",
    duration: 2,
    optimizationResults: entries,
    recommendationSummary: {
      total: entries.length,
      selectable: 0,
      selectedByDefault: 0,
      alreadyOptimized: 0,
      keepDefault: 0,
      optional: 0,
      recommended: 0
    },
    estimatedImpact: "Unknown",
    estimatedRisk: "Unknown",
    executionEstimate: "Unknown"
  };
}

function buildReportItem(overrides: Partial<DecisionReportItem> = {}): DecisionReportItem {
  return {
    id: "windows-search",
    title: "Windows Search",
    category: "Performance",
    recommendation: "Recommended",
    reason: "Test reason",
    currentState: "Running",
    riskLevel: "Low",
    expectedBenefit: "Medium",
    priority: "High",
    canRealApply: true,
    canVerify: true,
    canRecover: true,
    selectable: true,
    scanAvailable: true,
    runtimeScanStatus: "Detected",
    detectionMethod: "Test detection",
    detectionConfidence: "High",
    section: "recommended",
    ignoreConsequence: "Test consequence",
    estimatedMinutes: 1,
    ...overrides
  };
}

const priorityOrder = { High: 0, Medium: 1, Low: 2, Unknown: 3 } as const;
const levelOrder = { High: 0, Medium: 1, Low: 2, Unknown: 3 } as const;

function referenceCompare(left: DecisionReportItem, right: DecisionReportItem): number {
  return (
    priorityOrder[left.priority] - priorityOrder[right.priority] ||
    levelOrder[left.riskLevel] - levelOrder[right.riskLevel] ||
    levelOrder[left.expectedBenefit] - levelOrder[right.expectedBenefit] ||
    left.title.localeCompare(right.title)
  );
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("buildModel", () => {
  it("returns an empty model with all sections when no scan exists", () => {
    const model = DecisionReportService.buildModel(null);

    expect(model.hasScan).toBe(false);
    expect(model.allItems).toEqual([]);
    expect(model.sections.map((section) => section.id)).toEqual([
      "recommended",
      "optional",
      "keep-current",
      "unavailable"
    ]);
    expect(model.sections.every((section) => section.items.length === 0)).toBe(true);
    expect(model.hero).toEqual({
      totalRecommendations: 0,
      estimatedImpact: "Unknown",
      estimatedRisk: "Unknown",
      estimatedExecutionMinutes: null
    });
  });

  it("classifies items into sections by recommendation and scan status", () => {
    const scanResult = buildScanResult([
      buildScanEntry("windows-search", "Recommended"),
      buildScanEntry("delivery-optimization", "Optional"),
      buildScanEntry("core-isolation", "Keep Default"),
      buildScanEntry("game-mode", "Keep Enabled"),
      buildScanEntry("sysmain", "Already Optimized"),
      buildScanEntry("visual-effects", "Optional", "Not Supported Yet")
    ]);

    const model = DecisionReportService.buildModel(scanResult);
    const sectionById = new Map(model.sections.map((section) => [section.id, section]));

    expect(model.hasScan).toBe(true);
    expect(sectionById.get("recommended")?.items.map((item) => item.id)).toEqual(["windows-search"]);
    expect(sectionById.get("optional")?.items.map((item) => item.id)).toEqual(["delivery-optimization"]);
    expect(sectionById.get("keep-current")?.items.map((item) => item.id).sort()).toEqual([
      "core-isolation",
      "game-mode",
      "sysmain"
    ]);
    expect(sectionById.get("unavailable")?.items.map((item) => item.id)).toEqual(["visual-effects"]);
  });

  it("only marks items selectable when real apply is supported", () => {
    const scanResult = buildScanResult([
      buildScanEntry("windows-search", "Recommended"),
      buildScanEntry("startup-apps", "Optional")
    ]);

    const model = DecisionReportService.buildModel(scanResult);
    const itemById = new Map(model.allItems.map((item) => [item.id, item]));

    expect(itemById.get("windows-search")?.canRealApply).toBe(true);
    expect(itemById.get("windows-search")?.selectable).toBe(true);
    expect(itemById.get("startup-apps")?.canRealApply).toBe(false);
    expect(itemById.get("startup-apps")?.selectable).toBe(false);
  });

  it("sorts items by priority, then risk, then benefit, then title", () => {
    const scanResult = buildScanResult([
      buildScanEntry("visual-effects", "Optional"),
      buildScanEntry("windows-search", "Recommended"),
      buildScanEntry("core-isolation", "Optional"),
      buildScanEntry("power-plan", "Recommended"),
      buildScanEntry("game-mode", "Optional")
    ]);

    const model = DecisionReportService.buildModel(scanResult);

    expect(model.allItems.length).toBe(5);
    expect(model.allItems).toEqual([...model.allItems].sort(referenceCompare));
  });
});

describe("filterItems", () => {
  const items = [
    buildReportItem({ id: "windows-search", canRealApply: true, riskLevel: "Low", category: "Performance" }),
    buildReportItem({ id: "startup-apps", canRealApply: false, riskLevel: "Medium", category: "Performance" }),
    buildReportItem({ id: "core-isolation", canRealApply: true, riskLevel: "Medium", category: "Security" })
  ];

  it("keeps everything for the all filter", () => {
    expect(DecisionReportService.filterItems(items, "all")).toHaveLength(3);
  });

  it("filters to real-apply capable items", () => {
    expect(DecisionReportService.filterItems(items, "real-apply").map((item) => item.id)).toEqual([
      "windows-search",
      "core-isolation"
    ]);
  });

  it("filters to knowledge-only items", () => {
    expect(DecisionReportService.filterItems(items, "knowledge-only").map((item) => item.id)).toEqual(["startup-apps"]);
  });

  it("filters by risk level", () => {
    expect(DecisionReportService.filterItems(items, "risk", "Medium").map((item) => item.id)).toEqual([
      "startup-apps",
      "core-isolation"
    ]);
  });

  it("filters by category", () => {
    expect(DecisionReportService.filterItems(items, "category", undefined, "Security").map((item) => item.id)).toEqual([
      "core-isolation"
    ]);
  });
});

describe("summarizeSelection", () => {
  const supported = buildReportItem({
    id: "windows-search",
    canRealApply: true,
    selectable: true,
    riskLevel: "Low",
    estimatedMinutes: 2
  });
  const supportedSecond = buildReportItem({
    id: "sysmain",
    canRealApply: true,
    selectable: true,
    riskLevel: "Medium",
    estimatedMinutes: 3
  });
  const unsupported = buildReportItem({
    id: "startup-apps",
    canRealApply: false,
    selectable: true,
    riskLevel: "High"
  });
  const notSelectable = buildReportItem({ id: "core-isolation", selectable: false });
  const items = [supported, supportedSecond, unsupported, notSelectable];

  it("disables apply when nothing is selected", () => {
    const summary = DecisionReportService.summarizeSelection([], items);

    expect(summary.applyState).toBe("disabled-none");
    expect(summary.selectedCount).toBe(0);
    expect(summary.highestSelectedRisk).toBe("None");
    expect(summary.applyTargetId).toBeUndefined();
  });

  it("ignores selections of non-selectable items", () => {
    const summary = DecisionReportService.summarizeSelection(["core-isolation"], items);

    expect(summary.selectedCount).toBe(0);
    expect(summary.applyState).toBe("disabled-none");
  });

  it("disables apply when only unsupported items are selected", () => {
    const summary = DecisionReportService.summarizeSelection(["startup-apps"], items);

    expect(summary.applyState).toBe("disabled-unsupported");
    expect(summary.selectedCount).toBe(1);
    expect(summary.supportedSelectedCount).toBe(0);
    expect(summary.unsupportedSelectedCount).toBe(1);
  });

  it("disables apply when multiple supported items are selected", () => {
    const summary = DecisionReportService.summarizeSelection(["windows-search", "sysmain"], items);

    expect(summary.applyState).toBe("disabled-multiple");
    expect(summary.supportedSelectedCount).toBe(2);
    expect(summary.applyTargetId).toBeUndefined();
  });

  it("is ready with exactly one supported item selected", () => {
    const summary = DecisionReportService.summarizeSelection(["windows-search"], items);

    expect(summary.applyState).toBe("ready");
    expect(summary.applyTargetId).toBe("windows-search");
    expect(summary.highestSelectedRisk).toBe("Low");
  });

  it("stays ready but flags mixed selections with unsupported items", () => {
    const readySummary = DecisionReportService.summarizeSelection(["windows-search"], items);
    const mixedSummary = DecisionReportService.summarizeSelection(["windows-search", "startup-apps"], items);

    expect(mixedSummary.applyState).toBe("ready");
    expect(mixedSummary.unsupportedSelectedCount).toBe(1);
    expect(mixedSummary.applyMessage).not.toBe(readySummary.applyMessage);
  });

  it("reports the highest risk among selected items", () => {
    const summary = DecisionReportService.summarizeSelection(["windows-search", "startup-apps"], items);

    expect(summary.highestSelectedRisk).toBe("High");
  });

  it("accumulates estimated execution time across selected items", () => {
    const single = DecisionReportService.summarizeSelection(["windows-search"], items);
    const multiple = DecisionReportService.summarizeSelection(["windows-search", "sysmain"], items);

    expect(single.estimatedExecutionTime.length).toBeGreaterThan(0);
    expect(multiple.estimatedExecutionTime.length).toBeGreaterThan(0);
    expect(multiple.estimatedExecutionTime).not.toBe(single.estimatedExecutionTime);
  });

  it("does not invent execution time when selected minutes are unknown", () => {
    const unknownTime = buildReportItem({
      id: "hags",
      canRealApply: true,
      selectable: true,
      estimatedMinutes: null
    });
    const summary = DecisionReportService.summarizeSelection(["hags"], [unknownTime]);

    expect(summary.estimatedExecutionTime).toBe(
      LocalizationService.translate("report.metric.pendingEvaluation")
    );
  });
});

describe("summarizeHeroMetrics", () => {
  beforeEach(() => {
    stubMatchMedia();
    SettingsService.updateSettings({ language: "en" });
  });

  afterEach(() => {
    SettingsService.updateSettings({ language: "en" });
  });

  it("derives highest known impact and risk without hardcoded Medium/Low placeholders", () => {
    const hero = DecisionReportService.summarizeHeroMetrics([
      buildReportItem({
        id: "windows-search",
        expectedBenefit: "Medium",
        riskLevel: "Low",
        section: "recommended",
        estimatedMinutes: 1
      }),
      buildReportItem({
        id: "core-isolation",
        expectedBenefit: "Low",
        riskLevel: "High",
        section: "optional",
        estimatedMinutes: 5
      }),
      buildReportItem({
        id: "startup-apps",
        expectedBenefit: "Unknown",
        riskLevel: "Unknown",
        section: "keep-current",
        estimatedMinutes: null
      })
    ]);

    expect(hero.totalRecommendations).toBe(3);
    expect(hero.estimatedImpact).toBe("Medium");
    expect(hero.estimatedRisk).toBe("High");
    expect(hero.estimatedExecutionMinutes).toBe(1);
  });

  it("returns unknown/pending hero values for empty or unknown-only inputs", () => {
    expect(DecisionReportService.summarizeHeroMetrics([])).toEqual({
      totalRecommendations: 0,
      estimatedImpact: "Unknown",
      estimatedRisk: "Unknown",
      estimatedExecutionMinutes: null
    });

    const unknownOnly = DecisionReportService.summarizeHeroMetrics([
      buildReportItem({
        expectedBenefit: "Unknown",
        riskLevel: "Unknown",
        section: "recommended",
        estimatedMinutes: null
      })
    ]);

    expect(unknownOnly.estimatedImpact).toBe("Unknown");
    expect(unknownOnly.estimatedRisk).toBe("Unknown");
    expect(unknownOnly.estimatedExecutionMinutes).toBeNull();
  });

  it("does not invent execution minutes when any recommended item lacks a known estimate", () => {
    const hero = DecisionReportService.summarizeHeroMetrics([
      buildReportItem({
        id: "windows-search",
        section: "recommended",
        estimatedMinutes: 1
      }),
      buildReportItem({
        id: "hags",
        section: "recommended",
        estimatedMinutes: null
      })
    ]);

    expect(hero.estimatedExecutionMinutes).toBeNull();
  });

  it("exposes localized pending evaluation text after language switches", () => {
    const hero = DecisionReportService.summarizeHeroMetrics([]);
    expect(hero.estimatedImpact).toBe("Unknown");
    expect(hero.estimatedRisk).toBe("Unknown");
    expect(hero.estimatedExecutionMinutes).toBeNull();

    SettingsService.updateSettings({ language: "zh-CN" });
    expect(LocalizationService.translate("report.metric.pendingEvaluation")).toBe("待评估");
    expect(LocalizationService.translate("common.value.unknown")).toBe("未知");

    SettingsService.updateSettings({ language: "en" });
    expect(LocalizationService.translate("report.metric.pendingEvaluation")).toBe("Pending evaluation");
    expect(LocalizationService.translate("report.metric.pendingEvaluation")).not.toBe("Medium");
    expect(LocalizationService.translate("report.metric.pendingEvaluation")).not.toBe("3 min");
  });

  it("builds hero summary on the report model from real scan items", () => {
    const model = DecisionReportService.buildModel(
      buildScanResult([
        buildScanEntry("windows-search", "Recommended"),
        buildScanEntry("core-isolation", "Optional")
      ])
    );

    expect(model.hero.totalRecommendations).toBe(2);
    expect(model.hero.estimatedImpact).not.toBe("Unknown");
    expect(model.hero.estimatedRisk).toBe("High");
    expect(model.hero.estimatedExecutionMinutes).toBeTypeOf("number");
  });
});
