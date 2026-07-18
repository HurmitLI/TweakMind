import { describe, expect, it } from "vitest";
import type { OptimizationId, OptimizationRecommendation, OptimizationStatus } from "../../types/optimization";
import type { OptimizationEvaluation, OptimizationSdkModule } from "./OptimizationSdk";
import {
  isSelectableRecommendation,
  isSelectedByDefaultRecommendation,
  normalizeOptimizationStatus
} from "./OptimizationSdk";
import { optimizationSdkModules } from "./optimizations";

const modulesById = new Map<OptimizationId, OptimizationSdkModule>(
  optimizationSdkModules.map((module) => [module.definition.id, module])
);

function evaluate(id: OptimizationId, detectedStatus: OptimizationStatus): OptimizationEvaluation {
  const module = modulesById.get(id);

  if (!module) {
    throw new Error(`No SDK module registered for ${id}`);
  }

  return module.evaluator.evaluate({
    definition: module.definition,
    detectedStatus,
    deviceType: "Gaming PC"
  });
}

describe("normalizeOptimizationStatus", () => {
  it("passes known statuses through", () => {
    expect(normalizeOptimizationStatus("Enabled")).toBe("Enabled");
    expect(normalizeOptimizationStatus("Disabled")).toBe("Disabled");
  });

  it("falls back to Unknown for missing values", () => {
    expect(normalizeOptimizationStatus(undefined)).toBe("Unknown");
    expect(normalizeOptimizationStatus("" as OptimizationStatus)).toBe("Unknown");
  });
});

describe("recommendation selectability helpers", () => {
  const selectableCases: Array<[OptimizationRecommendation, boolean, boolean]> = [
    ["Recommended", true, true],
    ["Optional", true, false],
    ["Keep Default", false, false],
    ["Keep Enabled", false, false],
    ["Already Optimized", false, false]
  ];

  it.each(selectableCases)("%s -> selectable=%s selectedByDefault=%s", (recommendation, selectable, selectedByDefault) => {
    expect(isSelectableRecommendation(recommendation)).toBe(selectable);
    expect(isSelectedByDefaultRecommendation(recommendation)).toBe(selectedByDefault);
  });
});

describe("SDK module registry", () => {
  it("registers every optimization exactly once", () => {
    expect(modulesById.size).toBe(optimizationSdkModules.length);
    expect(modulesById.size).toBe(11);
  });
});

describe("service evaluators (windows-search, sysmain)", () => {
  const serviceIds: OptimizationId[] = ["windows-search", "sysmain"];

  it.each(serviceIds)("%s: Disabled means already optimized and never selectable", (id) => {
    const evaluation = evaluate(id, "Disabled");

    expect(evaluation.recommendation).toBe("Already Optimized");
    expect(evaluation.selectable).toBe(false);
    expect(evaluation.selectedByDefault).toBe(false);
    expect(evaluation.currentStatus).toBe("Disabled");
  });

  it.each(serviceIds)("%s: an active service is recommended and pre-selected", (id) => {
    for (const status of ["Enabled", "Running", "Stopped"] as const) {
      const evaluation = evaluate(id, status);

      expect(evaluation.recommendation).toBe("Recommended");
      expect(evaluation.selectable).toBe(true);
      expect(evaluation.selectedByDefault).toBe(true);
      expect(evaluation.currentStatus).toBe(status);
    }
  });

  it.each(serviceIds)("%s: unreadable state degrades to Optional / Unknown", (id) => {
    const evaluation = evaluate(id, "Unknown");

    expect(evaluation.recommendation).toBe("Optional");
    expect(evaluation.selectable).toBe(true);
    expect(evaluation.selectedByDefault).toBe(false);
    expect(evaluation.currentStatus).toBe("Unknown");
  });
});

describe("game-mode evaluator", () => {
  it("keeps an already enabled Game Mode and blocks selection", () => {
    const evaluation = evaluate("game-mode", "Enabled");

    expect(evaluation.recommendation).toBe("Keep Enabled");
    expect(evaluation.selectable).toBe(false);
  });

  it("recommends enabling when disabled", () => {
    const evaluation = evaluate("game-mode", "Disabled");

    expect(evaluation.recommendation).toBe("Recommended");
    expect(evaluation.selectedByDefault).toBe(true);
  });

  it("degrades to Optional when the state is unknown", () => {
    expect(evaluate("game-mode", "Unknown").recommendation).toBe("Optional");
  });
});

describe("core-isolation evaluator", () => {
  it("never recommends disabling the security default", () => {
    expect(evaluate("core-isolation", "Enabled").recommendation).toBe("Keep Default");
    expect(evaluate("core-isolation", "Enabled").selectable).toBe(false);
  });

  it("treats a disabled state as Optional, never pre-selected", () => {
    const evaluation = evaluate("core-isolation", "Disabled");

    expect(evaluation.recommendation).toBe("Optional");
    expect(evaluation.selectedByDefault).toBe(false);
  });
});

describe("hags evaluator", () => {
  it("keeps HAGS enabled when already on", () => {
    expect(evaluate("hags", "Enabled").recommendation).toBe("Keep Enabled");
  });

  it("recommends enabling when disabled", () => {
    expect(evaluate("hags", "Disabled").recommendation).toBe("Recommended");
  });
});

describe("power-plan evaluator", () => {
  it("marks High Performance as already optimized", () => {
    const evaluation = evaluate("power-plan", "Enabled");

    expect(evaluation.recommendation).toBe("Already Optimized");
    expect(evaluation.selectable).toBe(false);
  });

  it("recommends switching away from the Balanced default", () => {
    expect(evaluate("power-plan", "Default").recommendation).toBe("Recommended");
  });

  it("degrades to Optional when the active scheme is unknown", () => {
    expect(evaluate("power-plan", "Unknown").recommendation).toBe("Optional");
  });
});

describe("always-optional evaluators", () => {
  const optionalIds: OptimizationId[] = [
    "delivery-optimization",
    "background-apps",
    "startup-apps",
    "windows-update-active-hours",
    "visual-effects"
  ];

  it.each(optionalIds)("%s stays Optional regardless of the detected state", (id) => {
    for (const status of ["Enabled", "Disabled", "Unknown"] as const) {
      const evaluation = evaluate(id, status);

      expect(evaluation.recommendation).toBe("Optional");
      expect(evaluation.selectable).toBe(true);
      expect(evaluation.selectedByDefault).toBe(false);
    }
  });
});
