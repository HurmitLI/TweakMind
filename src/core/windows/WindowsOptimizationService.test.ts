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
});

afterEach(() => {
  vi.restoreAllMocks();
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

  it("consumePendingRecoveryAuthorization survives session and local removeItem failures", () => {
    storePendingRecoveryAuthorization("entry-1");
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("remove blocked");
    });

    expect(consumePendingRecoveryAuthorization("entry-1")).toBe(false);
    expect(() => clearPendingRecoveryAuthorization()).not.toThrow();
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
