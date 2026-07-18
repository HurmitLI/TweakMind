import { beforeEach, describe, expect, it } from "vitest";
import type { OptimizationScanResult, ScanResult } from "./ScanResult";
import {
  isValidScanResult,
  parseScanResultTimestamp,
  readStoredScanResult,
  scanResultStorageKey,
  storeScanResult,
  toRecommendationResult
} from "./ScanResult";

function buildOptimizationScanResult(overrides: Partial<OptimizationScanResult> = {}): OptimizationScanResult {
  return {
    id: "windows-search",
    definition: {} as OptimizationScanResult["definition"],
    rawDetectedValue: "Running",
    normalizedStatus: "Running",
    recommendation: "Recommended",
    reason: "Windows Search indexing keeps running in the background.",
    selectable: true,
    selectedByDefault: true,
    runtimeScan: {} as OptimizationScanResult["runtimeScan"],
    ...overrides
  };
}

function buildScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    timestamp: "1700000000",
    duration: 3,
    optimizationResults: [buildOptimizationScanResult()],
    recommendationSummary: {
      total: 1,
      selectable: 1,
      selectedByDefault: 1,
      alreadyOptimized: 0,
      keepDefault: 0,
      optional: 0,
      recommended: 1
    },
    estimatedImpact: "Medium",
    estimatedRisk: "Low",
    executionEstimate: "About 1 minute",
    ...overrides
  };
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("isValidScanResult", () => {
  it("accepts a complete scan result", () => {
    expect(isValidScanResult(buildScanResult())).toBe(true);
  });

  it("rejects non-object values", () => {
    expect(isValidScanResult(null)).toBe(false);
    expect(isValidScanResult(undefined)).toBe(false);
    expect(isValidScanResult("scan")).toBe(false);
    expect(isValidScanResult(42)).toBe(false);
  });

  it("rejects a truncated payload missing the recommendation summary", () => {
    const truncated = { ...buildScanResult() } as Record<string, unknown>;
    delete truncated.recommendationSummary;

    expect(isValidScanResult(truncated)).toBe(false);
  });

  it("rejects a summary with a missing numeric field", () => {
    const scanResult = buildScanResult();
    const summary = { ...scanResult.recommendationSummary } as Record<string, unknown>;
    delete summary.recommended;

    expect(isValidScanResult({ ...scanResult, recommendationSummary: summary })).toBe(false);
  });

  it("rejects an empty optimization result list", () => {
    expect(isValidScanResult(buildScanResult({ optimizationResults: [] }))).toBe(false);
  });

  it("rejects when a single optimization entry is malformed", () => {
    const malformedEntry = { ...buildOptimizationScanResult(), selectable: "yes" };
    const scanResult = buildScanResult({
      optimizationResults: [buildOptimizationScanResult(), malformedEntry as unknown as OptimizationScanResult]
    });

    expect(isValidScanResult(scanResult)).toBe(false);
  });

  it("rejects a non-numeric duration", () => {
    expect(isValidScanResult({ ...buildScanResult(), duration: "3" })).toBe(false);
  });
});

describe("parseScanResultTimestamp", () => {
  it("parses Unix second strings", () => {
    expect(parseScanResultTimestamp("1700000000")).toBe(1700000000);
  });

  it("parses legacy ISO date strings into Unix seconds", () => {
    expect(parseScanResultTimestamp("2023-11-14T22:13:20.000Z")).toBe(1700000000);
  });

  it("trims surrounding whitespace", () => {
    expect(parseScanResultTimestamp("  1700000000  ")).toBe(1700000000);
  });

  it("returns null for empty input", () => {
    expect(parseScanResultTimestamp("")).toBeNull();
    expect(parseScanResultTimestamp("   ")).toBeNull();
  });

  it("returns null for zero seconds", () => {
    expect(parseScanResultTimestamp("0")).toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(parseScanResultTimestamp("not-a-date")).toBeNull();
  });
});

describe("readStoredScanResult", () => {
  it("returns null when nothing is stored", () => {
    expect(readStoredScanResult()).toBeNull();
  });

  it("returns null for corrupted JSON", () => {
    window.localStorage.setItem(scanResultStorageKey, "{ not json");
    expect(readStoredScanResult()).toBeNull();
  });

  it("returns null for parseable but invalid payloads", () => {
    window.localStorage.setItem(scanResultStorageKey, JSON.stringify({ timestamp: "1700000000" }));
    expect(readStoredScanResult()).toBeNull();
  });

  it("prefers the newer result when both storages hold one", () => {
    const older = buildScanResult({ timestamp: "1700000000", estimatedImpact: "Older" });
    const newer = buildScanResult({ timestamp: "1700000500", estimatedImpact: "Newer" });

    window.localStorage.setItem(scanResultStorageKey, JSON.stringify(older));
    window.sessionStorage.setItem(scanResultStorageKey, JSON.stringify(newer));
    expect(readStoredScanResult()?.estimatedImpact).toBe("Newer");

    window.localStorage.setItem(scanResultStorageKey, JSON.stringify(newer));
    window.sessionStorage.setItem(scanResultStorageKey, JSON.stringify(older));
    expect(readStoredScanResult()?.estimatedImpact).toBe("Newer");
  });

  it("compares legacy ISO timestamps against Unix second timestamps", () => {
    const legacyNewer = buildScanResult({ timestamp: "2023-11-14T22:21:40.000Z", estimatedImpact: "LegacyNewer" });
    const unixOlder = buildScanResult({ timestamp: "1700000000", estimatedImpact: "UnixOlder" });

    window.localStorage.setItem(scanResultStorageKey, JSON.stringify(unixOlder));
    window.sessionStorage.setItem(scanResultStorageKey, JSON.stringify(legacyNewer));

    expect(readStoredScanResult()?.estimatedImpact).toBe("LegacyNewer");
  });

  it("falls back to the parseable result when one timestamp is unreadable", () => {
    const unreadable = buildScanResult({ timestamp: "not-a-date", estimatedImpact: "Unreadable" });
    const readable = buildScanResult({ timestamp: "1700000000", estimatedImpact: "Readable" });

    window.localStorage.setItem(scanResultStorageKey, JSON.stringify(unreadable));
    window.sessionStorage.setItem(scanResultStorageKey, JSON.stringify(readable));

    expect(readStoredScanResult()?.estimatedImpact).toBe("Readable");
  });
});

describe("storeScanResult", () => {
  it("stores a valid result in both storages", () => {
    storeScanResult(buildScanResult());

    expect(window.localStorage.getItem(scanResultStorageKey)).not.toBeNull();
    expect(window.sessionStorage.getItem(scanResultStorageKey)).not.toBeNull();
  });

  it("refuses to store an invalid result", () => {
    storeScanResult(buildScanResult({ optimizationResults: [] }));

    expect(window.localStorage.getItem(scanResultStorageKey)).toBeNull();
    expect(window.sessionStorage.getItem(scanResultStorageKey)).toBeNull();
  });
});

describe("toRecommendationResult", () => {
  it("projects the scan entry onto the recommendation shape", () => {
    const entry = buildOptimizationScanResult({ normalizedStatus: "Stopped", selectedByDefault: false });

    expect(toRecommendationResult(entry)).toEqual({
      id: "windows-search",
      recommendation: "Recommended",
      reason: entry.reason,
      currentStatus: "Stopped",
      selectable: true,
      selectedByDefault: false
    });
  });
});
