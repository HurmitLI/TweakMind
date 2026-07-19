import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  OptimizationApplyResult,
  OptimizationHistoryEntry,
  OptimizationRecoveryResult
} from "./WindowsOptimizationService";
import {
  clearPendingApplyResult,
  clearPendingRecoveryAuthorization,
  clearPendingRecoveryResult,
  consumePendingRecoveryAuthorization,
  hasPendingRecoveryAuthorization,
  resetConsumedRecoveryAuthorizationForTests,
  resetPendingApplyRuntimeForTests,
  isValidApplyResult,
  isValidHistoryEntry,
  isValidRecoveryResult,
  optimizationHistoryStorageKey,
  pendingApplyResultStorageKey,
  pendingRecoveryAuthorizationStorageKey,
  pendingRecoveryResultStorageKey,
  readPendingApplyResult,
  readPendingRecoveryResult,
  storePendingApplyResult,
  storePendingRecoveryAuthorization,
  storePendingRecoveryResult,
  WindowsOptimizationService
} from "./WindowsOptimizationService";

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

function buildRecoveryResult(overrides: Partial<OptimizationRecoveryResult> = {}): OptimizationRecoveryResult {
  return {
    historyEntryId: "entry-1",
    optimizationId: "windows-search",
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

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetConsumedRecoveryAuthorizationForTests();
  resetPendingApplyRuntimeForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetConsumedRecoveryAuthorizationForTests();
  resetPendingApplyRuntimeForTests();
});

describe("isValidHistoryEntry", () => {
  it("accepts a complete entry", () => {
    expect(isValidHistoryEntry(buildHistoryEntry())).toBe(true);
  });

  it("accepts entries with optional verification and recovery fields", () => {
    expect(
      isValidHistoryEntry(buildHistoryEntry({ verificationStatus: "Verified", recoveryStatus: "Success" }))
    ).toBe(true);
  });

  it("rejects non-object values", () => {
    expect(isValidHistoryEntry(null)).toBe(false);
    expect(isValidHistoryEntry("entry")).toBe(false);
  });

  it("rejects entries missing required fields", () => {
    const entry = { ...buildHistoryEntry() } as Record<string, unknown>;
    delete entry.optimizationId;

    expect(isValidHistoryEntry(entry)).toBe(false);
  });

  it("rejects entries with wrong field types", () => {
    expect(isValidHistoryEntry(buildHistoryEntry({ isAdmin: "yes" as unknown as boolean }))).toBe(false);
    expect(isValidHistoryEntry(buildHistoryEntry({ status: "Done" as unknown as "Success" }))).toBe(false);
  });
});

describe("history reading with corrupted storage", () => {
  it("returns an empty list for unparseable JSON", () => {
    window.localStorage.setItem(optimizationHistoryStorageKey, "{ not json");
    expect(WindowsOptimizationService.getHistory()).toEqual([]);
  });

  it("returns an empty list when the payload is not an array", () => {
    window.localStorage.setItem(optimizationHistoryStorageKey, JSON.stringify({ id: "entry-1" }));
    expect(WindowsOptimizationService.getHistory()).toEqual([]);
  });

  it("drops corrupt entries while preserving valid ones", () => {
    const valid = buildHistoryEntry();
    const corrupt = { id: "entry-2", optimizationId: 42 };
    window.localStorage.setItem(optimizationHistoryStorageKey, JSON.stringify([valid, corrupt]));

    const history = WindowsOptimizationService.getHistory();

    expect(history).toHaveLength(1);
    expect(history[0].id).toBe("entry-1");
  });

  it("still records new history after corruption", () => {
    window.localStorage.setItem(optimizationHistoryStorageKey, "{ not json");
    WindowsOptimizationService.recordHistory(buildHistoryEntry());

    expect(WindowsOptimizationService.getHistory()).toHaveLength(1);
  });
});

describe("pending apply result validation", () => {
  it("round-trips a valid result", () => {
    storePendingApplyResult(buildApplyResult());
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-1");
  });

  it("returns null when the stored optimization does not match", () => {
    storePendingApplyResult(buildApplyResult());
    expect(readPendingApplyResult("sysmain")).toBeNull();
  });

  it("ignores unparseable payloads", () => {
    window.sessionStorage.setItem(pendingApplyResultStorageKey, "{ not json");
    window.localStorage.setItem(pendingApplyResultStorageKey, "{ not json");
    expect(readPendingApplyResult("windows-search")).toBeNull();
  });

  it("ignores parseable but structurally invalid payloads", () => {
    const corrupt = JSON.stringify({ optimizationId: "windows-search", status: "done" });
    window.sessionStorage.setItem(pendingApplyResultStorageKey, corrupt);
    window.localStorage.setItem(pendingApplyResultStorageKey, corrupt);
    expect(readPendingApplyResult("windows-search")).toBeNull();
  });

  it("falls back to a valid local copy when the session copy is corrupt", () => {
    window.sessionStorage.setItem(pendingApplyResultStorageKey, JSON.stringify({ broken: true }));
    window.localStorage.setItem(pendingApplyResultStorageKey, JSON.stringify(buildApplyResult()));

    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-1");
  });

  it("validates status against the execution status enum", () => {
    expect(isValidApplyResult(buildApplyResult({ status: "pending" as unknown as "success" }))).toBe(false);
    expect(isValidApplyResult(buildApplyResult({ status: "unsupported" }))).toBe(true);
  });

  it("clears both session and local pending apply slots", () => {
    storePendingApplyResult(buildApplyResult());
    clearPendingApplyResult();

    expect(readPendingApplyResult("windows-search")).toBeNull();
    expect(window.sessionStorage.getItem(pendingApplyResultStorageKey)).toBeNull();
    expect(window.localStorage.getItem(pendingApplyResultStorageKey)).toBeNull();
  });

  it("keeps pending apply results for different optimizations in separate keyed slots", () => {
    storePendingApplyResult(buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-search" }));
    storePendingApplyResult(
      buildApplyResult({ optimizationId: "sysmain", historyEntryId: "entry-sysmain", previousState: "Stopped" })
    );

    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-search");
    expect(readPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-sysmain");
    expect(readPendingApplyResult("sysmain")?.previousState).toBe("Stopped");
  });

  it("clears only the matching optimization pending slot", () => {
    storePendingApplyResult(buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-search" }));
    storePendingApplyResult(buildApplyResult({ optimizationId: "hags", historyEntryId: "entry-hags" }));

    clearPendingApplyResult("windows-search");

    expect(readPendingApplyResult("windows-search")).toBeNull();
    expect(readPendingApplyResult("hags")?.historyEntryId).toBe("entry-hags");
  });

  it("migrates a legacy single-slot payload without mis-associating other optimization ids", () => {
    const legacy = buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-legacy" });
    window.sessionStorage.setItem(pendingApplyResultStorageKey, JSON.stringify(legacy));
    window.localStorage.setItem(pendingApplyResultStorageKey, JSON.stringify(legacy));

    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-legacy");
    expect(readPendingApplyResult("game-mode")).toBeNull();

    storePendingApplyResult(buildApplyResult({ optimizationId: "game-mode", historyEntryId: "entry-game" }));

    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-legacy");
    expect(readPendingApplyResult("game-mode")?.historyEntryId).toBe("entry-game");
  });

  it("ignores corrupt map keys that do not match the embedded optimization id", () => {
    const misplaced = {
      sysmain: buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-search" })
    };
    window.sessionStorage.setItem(pendingApplyResultStorageKey, JSON.stringify(misplaced));
    window.localStorage.setItem(pendingApplyResultStorageKey, JSON.stringify(misplaced));

    expect(readPendingApplyResult("sysmain")).toBeNull();
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-search");
  });

  it("succeeds when sessionStorage writes and localStorage quota fails", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.localStorage && key === pendingApplyResultStorageKey) {
        throw new Error("QuotaExceededError");
      }

      return originalSetItem.call(this, key, value);
    });

    expect(() =>
      storePendingApplyResult(buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-session" }))
    ).not.toThrow();

    expect(window.sessionStorage.getItem(pendingApplyResultStorageKey)).not.toBeNull();
    expect(window.localStorage.getItem(pendingApplyResultStorageKey)).toBeNull();
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-session");
    expect(readPendingApplyResult("sysmain")).toBeNull();
  });

  it("succeeds when localStorage writes and sessionStorage is unavailable", () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.sessionStorage && key === pendingApplyResultStorageKey) {
        throw new Error("SecurityError");
      }

      return originalSetItem.call(this, key, value);
    });

    expect(() =>
      storePendingApplyResult(buildApplyResult({ optimizationId: "sysmain", historyEntryId: "entry-local" }))
    ).not.toThrow();

    expect(window.localStorage.getItem(pendingApplyResultStorageKey)).not.toBeNull();
    expect(window.sessionStorage.getItem(pendingApplyResultStorageKey)).toBeNull();
    expect(readPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-local");
    expect(readPendingApplyResult("windows-search")).toBeNull();
  });

  it("throws a diagnostic error when both storages fail to write pending apply", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key) {
      if (key === pendingApplyResultStorageKey) {
        throw new Error(this === window.sessionStorage ? "session denied" : "local denied");
      }

      throw new Error("unexpected key");
    });

    expect(() => storePendingApplyResult(buildApplyResult())).toThrow(
      /Failed to persist pending apply result to sessionStorage \(session denied\) and localStorage \(local denied\)/
    );
    expect(readPendingApplyResult("windows-search")).toBeNull();
  });

  it("recovers on retry after a previous dual-storage pending apply failure", () => {
    const originalSetItem = Storage.prototype.setItem;
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    let denyWrites = true;

    setItemSpy.mockImplementation(function (this: Storage, key, value) {
      if (denyWrites && key === pendingApplyResultStorageKey) {
        throw new Error("storage denied");
      }

      return originalSetItem.call(this, key, value);
    });

    expect(() => storePendingApplyResult(buildApplyResult({ historyEntryId: "entry-first" }))).toThrow();

    denyWrites = false;
    storePendingApplyResult(buildApplyResult({ historyEntryId: "entry-retry" }));
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-retry");
  });

  it("clears local pending apply even when sessionStorage removeItem throws", () => {
    storePendingApplyResult(buildApplyResult());
    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === window.sessionStorage && key === pendingApplyResultStorageKey) {
        throw new Error("session remove blocked");
      }

      return originalRemoveItem.call(this, key);
    });

    expect(() => clearPendingApplyResult()).not.toThrow();
    expect(window.localStorage.getItem(pendingApplyResultStorageKey)).toBeNull();
  });

  it("clears only the matched slot on one-sided rewrite failure without wiping the other optimization", () => {
    storePendingApplyResult(buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-a" }));
    storePendingApplyResult(buildApplyResult({ optimizationId: "sysmain", historyEntryId: "entry-b" }));

    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.localStorage && key === pendingApplyResultStorageKey) {
        throw new Error("local rewrite denied");
      }

      return originalSetItem.call(this, key, value);
    });

    expect(() => clearPendingApplyResult("windows-search")).not.toThrow();
    expect(readPendingApplyResult("windows-search")).toBeNull();
    expect(readPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-b");
  });

  it("keeps interleaved multi-optimization slots readable after one-sided store degradation", () => {
    storePendingApplyResult(buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-a" }));

    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.localStorage && key === pendingApplyResultStorageKey) {
        throw new Error("QuotaExceededError");
      }

      return originalSetItem.call(this, key, value);
    });

    storePendingApplyResult(buildApplyResult({ optimizationId: "hags", historyEntryId: "entry-hags" }));

    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-a");
    expect(readPendingApplyResult("hags")?.historyEntryId).toBe("entry-hags");
    expect(readPendingApplyResult("sysmain")).toBeNull();
  });

  it("returns the new local write when stale session setItem fails (not the old session history id)", () => {
    const stale = buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-stale-session" });
    window.sessionStorage.setItem(pendingApplyResultStorageKey, JSON.stringify({ "windows-search": stale }));
    window.localStorage.setItem(
      pendingApplyResultStorageKey,
      JSON.stringify({ "windows-search": buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-stale-local" }) })
    );

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.sessionStorage && key === pendingApplyResultStorageKey) {
        throw new Error("QuotaExceededError");
      }

      return originalSetItem.call(this, key, value);
    });
    // Keep the stale session payload even if best-effort remove is attempted.
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === window.sessionStorage && key === pendingApplyResultStorageKey) {
        throw new Error("session remove blocked");
      }

      return originalRemoveItem.call(this, key);
    });

    storePendingApplyResult(buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-fresh-local" }));

    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-fresh-local");
    expect(window.localStorage.getItem(pendingApplyResultStorageKey)).toContain("entry-fresh-local");
    expect(window.sessionStorage.getItem(pendingApplyResultStorageKey)).toContain("entry-stale-session");
  });

  it("returns the new session write when stale local setItem fails", () => {
    const staleLocal = buildApplyResult({ optimizationId: "sysmain", historyEntryId: "entry-stale-local" });
    window.localStorage.setItem(pendingApplyResultStorageKey, JSON.stringify({ sysmain: staleLocal }));
    window.sessionStorage.setItem(
      pendingApplyResultStorageKey,
      JSON.stringify({ sysmain: buildApplyResult({ optimizationId: "sysmain", historyEntryId: "entry-stale-session" }) })
    );

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.localStorage && key === pendingApplyResultStorageKey) {
        throw new Error("QuotaExceededError");
      }

      return originalSetItem.call(this, key, value);
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === window.localStorage && key === pendingApplyResultStorageKey) {
        throw new Error("local remove blocked");
      }

      return originalRemoveItem.call(this, key);
    });

    storePendingApplyResult(buildApplyResult({ optimizationId: "sysmain", historyEntryId: "entry-fresh-session" }));

    expect(readPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-fresh-session");
    expect(window.sessionStorage.getItem(pendingApplyResultStorageKey)).toContain("entry-fresh-session");
    expect(window.localStorage.getItem(pendingApplyResultStorageKey)).toContain("entry-stale-local");
  });

  it("hides a cleared slot in-process when rewrite and remove both fail, keeping other ids isolated", () => {
    storePendingApplyResult(buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-a" }));
    storePendingApplyResult(buildApplyResult({ optimizationId: "sysmain", historyEntryId: "entry-b" }));

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (key === pendingApplyResultStorageKey) {
        throw new Error("rewrite denied");
      }

      return originalSetItem.call(this, key, value);
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (key === pendingApplyResultStorageKey) {
        throw new Error("remove denied");
      }

      return originalRemoveItem.call(this, key);
    });

    expect(() => clearPendingApplyResult("windows-search")).not.toThrow();
    expect(readPendingApplyResult("windows-search")).toBeNull();
    expect(readPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-b");
    // Physical leftovers may remain when both rewrite and remove fail.
    expect(window.sessionStorage.getItem(pendingApplyResultStorageKey)).toContain("entry-a");
  });

  it("rebuilds a previously cleared slot after rewrite/remove dual failure once store succeeds again", () => {
    storePendingApplyResult(buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-old" }));
    storePendingApplyResult(buildApplyResult({ optimizationId: "hags", historyEntryId: "entry-hags" }));

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem");
    let blockMutations = true;

    setItemSpy.mockImplementation(function (this: Storage, key, value) {
      if (blockMutations && key === pendingApplyResultStorageKey) {
        throw new Error("rewrite denied");
      }

      return originalSetItem.call(this, key, value);
    });
    removeItemSpy.mockImplementation(function (this: Storage, key) {
      if (blockMutations && key === pendingApplyResultStorageKey) {
        throw new Error("remove denied");
      }

      return originalRemoveItem.call(this, key);
    });

    clearPendingApplyResult("windows-search");
    expect(readPendingApplyResult("windows-search")).toBeNull();
    expect(readPendingApplyResult("hags")?.historyEntryId).toBe("entry-hags");

    blockMutations = false;
    storePendingApplyResult(buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-rebuilt" }));

    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-rebuilt");
    expect(readPendingApplyResult("hags")?.historyEntryId).toBe("entry-hags");
    expect(readPendingApplyResult("sysmain")).toBeNull();
  });

  it("does not promote an in-memory map when both storages fail to persist", () => {
    window.sessionStorage.setItem(
      pendingApplyResultStorageKey,
      JSON.stringify({ "windows-search": buildApplyResult({ historyEntryId: "entry-prior" }) })
    );

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key) {
      if (key === pendingApplyResultStorageKey) {
        throw new Error(this === window.sessionStorage ? "session denied" : "local denied");
      }

      throw new Error("unexpected key");
    });

    expect(() =>
      storePendingApplyResult(buildApplyResult({ historyEntryId: "entry-never-persisted" }))
    ).toThrow(/Failed to persist pending apply result/);

    // Dual-fail must not masquerade as success: prior durable value remains readable,
    // and the unpersisted history id must not appear.
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-prior");
  });
});

describe("pending recovery authorization lifecycle", () => {
  it("keeps authorization in session storage only", () => {
    storePendingRecoveryAuthorization("entry-1");

    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(true);
    expect(window.sessionStorage.getItem(pendingRecoveryAuthorizationStorageKey)).toBe("entry-1");
    expect(window.localStorage.getItem(pendingRecoveryAuthorizationStorageKey)).toBeNull();
  });

  it("ignores and clears legacy localStorage authorization after restart-equivalent session loss", () => {
    window.localStorage.setItem(pendingRecoveryAuthorizationStorageKey, "entry-1");

    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);
    expect(window.localStorage.getItem(pendingRecoveryAuthorizationStorageKey)).toBeNull();
  });

  it("still matches session authorization when legacy localStorage cleanup throws", () => {
    window.sessionStorage.setItem(pendingRecoveryAuthorizationStorageKey, "entry-1");
    window.localStorage.setItem(pendingRecoveryAuthorizationStorageKey, "entry-legacy");

    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === window.localStorage) {
        throw new Error("localStorage remove blocked");
      }

      return originalRemoveItem.call(this, key);
    });

    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(true);
    expect(hasPendingRecoveryAuthorization("entry-other")).toBe(false);
    expect(window.sessionStorage.getItem(pendingRecoveryAuthorizationStorageKey)).toBe("entry-1");
  });

  it("clears authorization from both storages", () => {
    window.sessionStorage.setItem(pendingRecoveryAuthorizationStorageKey, "entry-1");
    window.localStorage.setItem(pendingRecoveryAuthorizationStorageKey, "entry-1");

    clearPendingRecoveryAuthorization();

    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);
    expect(window.sessionStorage.getItem(pendingRecoveryAuthorizationStorageKey)).toBeNull();
    expect(window.localStorage.getItem(pendingRecoveryAuthorizationStorageKey)).toBeNull();
  });

  it("consumePendingRecoveryAuthorization removes only the matching session gate", () => {
    storePendingRecoveryAuthorization("entry-1");

    expect(consumePendingRecoveryAuthorization("entry-other")).toBe(false);
    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(true);
    expect(consumePendingRecoveryAuthorization("entry-1")).toBe(true);
    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);
  });

  it("tombstones consumed auth when sessionStorage.removeItem keeps failing", () => {
    storePendingRecoveryAuthorization("entry-1");

    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === window.sessionStorage && key === pendingRecoveryAuthorizationStorageKey) {
        throw new Error("session remove blocked");
      }

      return originalRemoveItem.call(this, key);
    });

    expect(consumePendingRecoveryAuthorization("entry-other")).toBe(false);
    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(true);

    expect(consumePendingRecoveryAuthorization("entry-1")).toBe(true);
    // Residue may remain physically, but runtime tombstone blocks replay.
    expect(window.sessionStorage.getItem(pendingRecoveryAuthorizationStorageKey)).toBe("entry-1");
    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);

    // A different history id can still be freshly authorized without clearing entry-1's tombstone.
    vi.mocked(Storage.prototype.removeItem).mockRestore();
    storePendingRecoveryAuthorization("entry-2");
    expect(hasPendingRecoveryAuthorization("entry-2")).toBe(true);
    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);

    // Re-confirming entry-1 clears only that id's tombstone.
    storePendingRecoveryAuthorization("entry-1");
    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(true);
  });
});

describe("pending recovery result validation", () => {
  it("round-trips a valid result", () => {
    storePendingRecoveryResult(buildRecoveryResult());
    expect(readPendingRecoveryResult("entry-1")?.status).toBe("success");
  });

  it("returns null when the history entry does not match", () => {
    storePendingRecoveryResult(buildRecoveryResult());
    expect(readPendingRecoveryResult("entry-9")).toBeNull();
  });

  it("ignores structurally invalid payloads", () => {
    const corrupt = JSON.stringify({ historyEntryId: "entry-1", status: 200 });
    window.sessionStorage.setItem(pendingRecoveryResultStorageKey, corrupt);
    window.localStorage.setItem(pendingRecoveryResultStorageKey, corrupt);
    expect(readPendingRecoveryResult("entry-1")).toBeNull();
  });

  it("requires error to be a string or null", () => {
    expect(isValidRecoveryResult(buildRecoveryResult({ error: 42 as unknown as string }))).toBe(false);
    expect(isValidRecoveryResult(buildRecoveryResult({ error: "failed" }))).toBe(true);
  });

  it("keeps interleaved recovery results for different history entries in separate keyed slots", () => {
    storePendingRecoveryResult(
      buildRecoveryResult({ historyEntryId: "entry-a", optimizationId: "windows-search", message: "A" })
    );
    storePendingRecoveryResult(
      buildRecoveryResult({ historyEntryId: "entry-b", optimizationId: "sysmain", message: "B", previousState: "Stopped" })
    );

    expect(readPendingRecoveryResult("entry-a")?.message).toBe("A");
    expect(readPendingRecoveryResult("entry-b")?.message).toBe("B");
    expect(readPendingRecoveryResult("entry-b")?.previousState).toBe("Stopped");
    expect(readPendingRecoveryResult("entry-missing")).toBeNull();
  });

  it("clears only the matching history-entry pending recovery slot", () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-a", message: "A" }));
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-b", message: "B" }));

    clearPendingRecoveryResult("entry-a");

    expect(readPendingRecoveryResult("entry-a")).toBeNull();
    expect(readPendingRecoveryResult("entry-b")?.message).toBe("B");
  });

  it("migrates a legacy single-slot recovery payload without mis-associating other history ids", () => {
    const legacy = buildRecoveryResult({ historyEntryId: "entry-legacy", message: "Legacy restore" });
    window.sessionStorage.setItem(pendingRecoveryResultStorageKey, JSON.stringify(legacy));
    window.localStorage.setItem(pendingRecoveryResultStorageKey, JSON.stringify(legacy));

    expect(readPendingRecoveryResult("entry-legacy")?.message).toBe("Legacy restore");
    expect(readPendingRecoveryResult("entry-other")).toBeNull();

    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-other", message: "Other" }));

    expect(readPendingRecoveryResult("entry-legacy")?.message).toBe("Legacy restore");
    expect(readPendingRecoveryResult("entry-other")?.message).toBe("Other");
  });

  it("ignores corrupt map keys that do not match the embedded history entry id", () => {
    const misplaced = {
      "entry-wrong-key": buildRecoveryResult({ historyEntryId: "entry-embedded", message: "Embedded" })
    };
    window.sessionStorage.setItem(pendingRecoveryResultStorageKey, JSON.stringify(misplaced));
    window.localStorage.setItem(pendingRecoveryResultStorageKey, JSON.stringify(misplaced));

    expect(readPendingRecoveryResult("entry-wrong-key")).toBeNull();
    expect(readPendingRecoveryResult("entry-embedded")?.message).toBe("Embedded");
  });
});
