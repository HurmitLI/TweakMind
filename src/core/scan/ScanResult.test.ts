import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startScanPageLifecycle } from "./ScanPageLifecycle";
import type { OptimizationScanResult, ScanResult } from "./ScanResult";
import {
  clearStoredScanResult,
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

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
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

  it("uses the valid side when the other storage copy is corrupt JSON", () => {
    const valid = buildScanResult({ estimatedImpact: "ValidSide" });
    window.sessionStorage.setItem(scanResultStorageKey, JSON.stringify(valid));
    window.localStorage.setItem(scanResultStorageKey, "{ not json");

    expect(readStoredScanResult()?.estimatedImpact).toBe("ValidSide");

    window.localStorage.setItem(scanResultStorageKey, JSON.stringify(valid));
    window.sessionStorage.setItem(scanResultStorageKey, "{ not json");

    expect(readStoredScanResult()?.estimatedImpact).toBe("ValidSide");
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

  it("succeeds when sessionStorage writes and localStorage quota fails", () => {
    const result = buildScanResult({ estimatedImpact: "SessionOnly" });
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.localStorage) {
        throw new Error("QuotaExceededError");
      }

      return originalSetItem.call(this, key, value);
    });

    expect(() => storeScanResult(result)).not.toThrow();
    expect(window.sessionStorage.getItem(scanResultStorageKey)).not.toBeNull();
    expect(window.localStorage.getItem(scanResultStorageKey)).toBeNull();
    expect(readStoredScanResult()?.estimatedImpact).toBe("SessionOnly");
  });

  it("succeeds when localStorage writes and sessionStorage is unavailable", () => {
    const result = buildScanResult({ estimatedImpact: "LocalOnly" });
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.sessionStorage) {
        throw new Error("SecurityError");
      }

      return originalSetItem.call(this, key, value);
    });

    expect(() => storeScanResult(result)).not.toThrow();
    expect(window.localStorage.getItem(scanResultStorageKey)).not.toBeNull();
    expect(window.sessionStorage.getItem(scanResultStorageKey)).toBeNull();
    expect(readStoredScanResult()?.estimatedImpact).toBe("LocalOnly");
  });

  it("throws a diagnostic error when both storages fail to write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage) {
      throw new Error(this === window.sessionStorage ? "session denied" : "local denied");
    });

    expect(() => storeScanResult(buildScanResult())).toThrow(
      /Failed to persist scan result to sessionStorage \(session denied\) and localStorage \(local denied\)/
    );
    expect(readStoredScanResult()).toBeNull();
  });

  it("recovers on retry after a previous dual-storage failure", () => {
    const originalSetItem = Storage.prototype.setItem;
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    let denyWrites = true;

    setItemSpy.mockImplementation(function (this: Storage, key, value) {
      if (denyWrites) {
        throw new Error("storage denied");
      }

      return originalSetItem.call(this, key, value);
    });

    expect(() => storeScanResult(buildScanResult({ estimatedImpact: "First" }))).toThrow();

    denyWrites = false;
    storeScanResult(buildScanResult({ estimatedImpact: "RetryOk" }));
    expect(readStoredScanResult()?.estimatedImpact).toBe("RetryOk");
  });
});

describe("clearStoredScanResult", () => {
  it("clears localStorage even when sessionStorage removeItem throws", () => {
    storeScanResult(buildScanResult());
    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === window.sessionStorage) {
        throw new Error("session remove blocked");
      }

      return originalRemoveItem.call(this, key);
    });

    expect(() => clearStoredScanResult()).not.toThrow();
    expect(window.localStorage.getItem(scanResultStorageKey)).toBeNull();
  });

  it("clears sessionStorage even when localStorage removeItem throws", () => {
    storeScanResult(buildScanResult());
    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === window.localStorage) {
        throw new Error("local remove blocked");
      }

      return originalRemoveItem.call(this, key);
    });

    expect(() => clearStoredScanResult()).not.toThrow();
    expect(window.sessionStorage.getItem(scanResultStorageKey)).toBeNull();
  });
});

describe("scan persistence failures through ScanPageLifecycle", () => {
  it("dual-store failure converges to failed without false 100% success navigation", async () => {
    vi.useFakeTimers();

    const originalSetItem = Storage.prototype.setItem;
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    let denyWrites = true;

    setItemSpy.mockImplementation(function (this: Storage, key, value) {
      if (denyWrites) {
        throw new Error("storage denied");
      }

      return originalSetItem.call(this, key, value);
    });

    const onSucceeded = vi.fn();
    const onFailed = vi.fn();
    let attempt = 0;

    const startAttempt = () =>
      startScanPageLifecycle({
        runScan: async () => {
          attempt += 1;

          if (attempt === 1) {
            storeScanResult(buildScanResult({ estimatedImpact: "Failing" }));
            return;
          }

          denyWrites = false;
          storeScanResult(buildScanResult({ estimatedImpact: "Recovered" }));
        },
        scanDurationMs: 400,
        scanTickMs: 100,
        successNavigateDelayMs: 100,
        onProgress: vi.fn(),
        onSucceeded,
        onFailed
      });

    const first = startAttempt();
    await Promise.resolve();
    expect(first.getStatus()).toBe("failed");
    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(onFailed.mock.calls[0]?.[0]).toMatch(/Failed to persist scan result/);
    expect(onSucceeded).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    expect(onSucceeded).not.toHaveBeenCalled();
    first.dispose();

    const second = startAttempt();
    await Promise.resolve();
    expect(second.getStatus()).toBe("succeeded");

    await vi.advanceTimersByTimeAsync(500);
    expect(onSucceeded).toHaveBeenCalledTimes(1);
    expect(readStoredScanResult()?.estimatedImpact).toBe("Recovered");
    second.dispose();
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
