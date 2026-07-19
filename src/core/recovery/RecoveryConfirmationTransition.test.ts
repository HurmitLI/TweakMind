import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPendingRecoveryAuthorization,
  hasPendingRecoveryAuthorization,
  pendingRecoveryAuthorizationStorageKey,
  readPendingRecoveryResult,
  resetConsumedRecoveryAuthorizationForTests,
  resetPendingRecoveryRuntimeForTests,
  storePendingRecoveryAuthorization,
  storePendingRecoveryResult,
  type OptimizationRecoveryResult
} from "../windows/WindowsOptimizationService";
import {
  beginRecoveryConfirmationTransition,
  isRecoveryConfirmationTransitionInFlight,
  resetRecoveryConfirmationTransitionForTests
} from "./RecoveryConfirmationTransition";

function buildRecoveryResult(overrides: Partial<OptimizationRecoveryResult> = {}): OptimizationRecoveryResult {
  return {
    historyEntryId: "entry-a",
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

function denySessionAuthorizationWrites() {
  const originalSetItem = Storage.prototype.setItem;
  return vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (this === window.sessionStorage && key === pendingRecoveryAuthorizationStorageKey) {
      throw new Error("session quota exceeded");
    }

    return originalSetItem.call(this, key, value);
  });
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetRecoveryConfirmationTransitionForTests();
  resetConsumedRecoveryAuthorizationForTests();
  resetPendingRecoveryRuntimeForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetRecoveryConfirmationTransitionForTests();
  resetConsumedRecoveryAuthorizationForTests();
  resetPendingRecoveryRuntimeForTests();
});

describe("beginRecoveryConfirmationTransition", () => {
  it("keeps pending recovery when authorization write fails and does not grant auth", () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-a", message: "KeepMe" }));
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-b", message: "Other" }));
    denySessionAuthorizationWrites();

    const result = beginRecoveryConfirmationTransition("entry-a");

    expect(result).toEqual({
      ok: false,
      reason: "authorization",
      errorMessage: "session quota exceeded"
    });
    expect(hasPendingRecoveryAuthorization("entry-a")).toBe(false);
    expect(readPendingRecoveryResult("entry-a")?.message).toBe("KeepMe");
    expect(readPendingRecoveryResult("entry-b")?.message).toBe("Other");
  });

  it("retries successfully after a previous authorization failure", () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-a", message: "PendingA" }));

    const originalSetItem = Storage.prototype.setItem;
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    let denyAuth = true;

    setItemSpy.mockImplementation(function (this: Storage, key, value) {
      if (denyAuth && this === window.sessionStorage && key === pendingRecoveryAuthorizationStorageKey) {
        throw new Error("session denied");
      }

      return originalSetItem.call(this, key, value);
    });

    expect(beginRecoveryConfirmationTransition("entry-a").ok).toBe(false);
    expect(readPendingRecoveryResult("entry-a")?.message).toBe("PendingA");

    denyAuth = false;
    expect(beginRecoveryConfirmationTransition("entry-a")).toEqual({ ok: true });
    expect(hasPendingRecoveryAuthorization("entry-a")).toBe(true);
    expect(readPendingRecoveryResult("entry-a")).toBeNull();
  });

  it("rejects a rapid second start for the same history entry id (double-click)", () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-a" }));

    const originalSetItem = Storage.prototype.setItem;
    let nestedCall = false;

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (!nestedCall && this === window.sessionStorage && key === pendingRecoveryAuthorizationStorageKey) {
        nestedCall = true;
        const duplicate = beginRecoveryConfirmationTransition("entry-a");
        expect(duplicate).toEqual({ ok: false, reason: "duplicate" });
        expect(isRecoveryConfirmationTransitionInFlight("entry-a")).toBe(true);
      }

      return originalSetItem.call(this, key, value);
    });

    expect(beginRecoveryConfirmationTransition("entry-a")).toEqual({ ok: true });
    expect(hasPendingRecoveryAuthorization("entry-a")).toBe(true);
    expect(isRecoveryConfirmationTransitionInFlight("entry-a")).toBe(false);
  });

  it("consumes only the matched pending slot and leaves other history ids intact", () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-a", message: "A" }));
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-b", message: "B" }));

    expect(beginRecoveryConfirmationTransition("entry-a")).toEqual({ ok: true });

    expect(hasPendingRecoveryAuthorization("entry-a")).toBe(true);
    expect(hasPendingRecoveryAuthorization("entry-b")).toBe(false);
    expect(readPendingRecoveryResult("entry-a")).toBeNull();
    expect(readPendingRecoveryResult("entry-b")?.message).toBe("B");
  });

  it("isolates wrong history ids: failed auth for entry-a does not clear entry-b", () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-a", message: "A" }));
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-b", message: "B" }));
    denySessionAuthorizationWrites();

    expect(beginRecoveryConfirmationTransition("entry-a").ok).toBe(false);
    expect(readPendingRecoveryResult("entry-a")?.message).toBe("A");
    expect(readPendingRecoveryResult("entry-b")?.message).toBe("B");
  });

  it("route-id switch style: confirming entry-b after entry-a keeps slots isolated", () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-a", message: "A" }));
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-b", message: "B" }));

    expect(beginRecoveryConfirmationTransition("entry-a")).toEqual({ ok: true });
    expect(hasPendingRecoveryAuthorization("entry-a")).toBe(true);
    expect(readPendingRecoveryResult("entry-b")?.message).toBe("B");

    expect(beginRecoveryConfirmationTransition("entry-b")).toEqual({ ok: true });
    expect(hasPendingRecoveryAuthorization("entry-b")).toBe(true);
    expect(hasPendingRecoveryAuthorization("entry-a")).toBe(false);
    expect(readPendingRecoveryResult("entry-a")).toBeNull();
    expect(readPendingRecoveryResult("entry-b")).toBeNull();

    clearPendingRecoveryAuthorization();
    storePendingRecoveryAuthorization("entry-b");
    expect(hasPendingRecoveryAuthorization("entry-b")).toBe(true);
  });

  it("rejects empty history ids without clearing unrelated pending slots", () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-a", message: "A" }));

    const result = beginRecoveryConfirmationTransition("");
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === "authorization") {
      expect(result.errorMessage).toMatch(/Missing history entry id/);
    }

    expect(readPendingRecoveryResult("entry-a")?.message).toBe("A");
  });

  it("survives persistent localStorage.removeItem failures end-to-end for auth write and read", () => {
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-a", message: "A" }));
    storePendingRecoveryResult(buildRecoveryResult({ historyEntryId: "entry-b", message: "B" }));

    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === window.localStorage) {
        throw new Error("localStorage remove blocked");
      }

      return originalRemoveItem.call(this, key);
    });

    expect(beginRecoveryConfirmationTransition("entry-a")).toEqual({ ok: true });
    expect(readPendingRecoveryResult("entry-a")).toBeNull();
    expect(readPendingRecoveryResult("entry-b")?.message).toBe("B");

    // RecoveryPage reads authorization immediately after navigation.
    expect(hasPendingRecoveryAuthorization("entry-a")).toBe(true);
    expect(hasPendingRecoveryAuthorization("entry-b")).toBe(false);
    expect(window.sessionStorage.getItem(pendingRecoveryAuthorizationStorageKey)).toBe("entry-a");
  });
});
