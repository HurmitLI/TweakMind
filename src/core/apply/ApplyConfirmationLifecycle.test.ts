import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPendingApplyResult,
  pendingApplyResultStorageKey,
  readPendingApplyResult,
  resetPendingApplyRuntimeForTests,
  storePendingApplyResult,
  type OptimizationApplyResult
} from "../windows/WindowsOptimizationService";
import {
  isApplyConfirmationInFlight,
  resetApplyConfirmationLifecycleForTests,
  startApplyConfirmationLifecycle
} from "./ApplyConfirmationLifecycle";

function buildResult(overrides: Partial<OptimizationApplyResult> = {}): OptimizationApplyResult {
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

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  resetApplyConfirmationLifecycleForTests();
  resetPendingApplyRuntimeForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetApplyConfirmationLifecycleForTests();
  resetPendingApplyRuntimeForTests();
});

describe("startApplyConfirmationLifecycle", () => {
  it("persists resolved results after dispose but does not navigate or update UI", async () => {
    let resolveApply!: (value: OptimizationApplyResult) => void;
    const onUiSuccess = vi.fn();
    const onUiFailure = vi.fn();
    const persistResult = vi.fn((result: OptimizationApplyResult) => {
      storePendingApplyResult(result);
    });

    const handle = startApplyConfirmationLifecycle({
      optimizationId: "windows-search",
      runApply: () =>
        new Promise((resolve) => {
          resolveApply = resolve;
        }),
      persistResult,
      onUiSuccess,
      onUiFailure
    });

    expect(handle.didStart).toBe(true);
    expect(isApplyConfirmationInFlight("windows-search")).toBe(true);

    handle.dispose();
    resolveApply(buildResult({ historyEntryId: "entry-persisted" }));
    await Promise.resolve();

    expect(persistResult).toHaveBeenCalledTimes(1);
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-persisted");
    expect(onUiSuccess).not.toHaveBeenCalled();
    expect(onUiFailure).not.toHaveBeenCalled();
    expect(isApplyConfirmationInFlight("windows-search")).toBe(false);
  });

  it("does not call UI failure after dispose when apply rejects", async () => {
    let rejectApply!: (reason?: unknown) => void;
    const onUiSuccess = vi.fn();
    const onUiFailure = vi.fn();

    const handle = startApplyConfirmationLifecycle({
      optimizationId: "sysmain",
      runApply: () =>
        new Promise((_resolve, reject) => {
          rejectApply = reject;
        }),
      persistResult: vi.fn(),
      onUiSuccess,
      onUiFailure
    });

    handle.dispose();
    rejectApply(new Error("native invoke aborted"));
    await Promise.resolve();

    expect(onUiSuccess).not.toHaveBeenCalled();
    expect(onUiFailure).not.toHaveBeenCalled();
    expect(isApplyConfirmationInFlight("sysmain")).toBe(false);
  });

  it("rejects a rapid second start for the same optimizationId (double-click / retry race)", async () => {
    let resolveFirst!: (value: OptimizationApplyResult) => void;
    const runApply = vi.fn(
      () =>
        new Promise<OptimizationApplyResult>((resolve) => {
          resolveFirst = resolve;
        })
    );
    const onUiSuccess = vi.fn();

    const first = startApplyConfirmationLifecycle({
      optimizationId: "windows-search",
      runApply,
      persistResult: storePendingApplyResult,
      onUiSuccess,
      onUiFailure: vi.fn()
    });

    const second = startApplyConfirmationLifecycle({
      optimizationId: "windows-search",
      runApply,
      persistResult: storePendingApplyResult,
      onUiSuccess,
      onUiFailure: vi.fn()
    });

    expect(first.didStart).toBe(true);
    expect(second.didStart).toBe(false);
    expect(second.getStatus()).toBe("rejected-duplicate");
    expect(runApply).toHaveBeenCalledTimes(1);

    resolveFirst(buildResult());
    await Promise.resolve();
    expect(onUiSuccess).toHaveBeenCalledTimes(1);
  });

  it("allows a single retry after a failed attempt", async () => {
    const onUiSuccess = vi.fn();
    const onUiFailure = vi.fn();
    let attempt = 0;

    const startAttempt = () =>
      startApplyConfirmationLifecycle({
        optimizationId: "hags",
        runApply: async () => {
          attempt += 1;

          if (attempt === 1) {
            throw new Error("First apply failed");
          }

          return buildResult({ optimizationId: "hags", historyEntryId: "entry-retry" });
        },
        persistResult: storePendingApplyResult,
        onUiSuccess,
        onUiFailure
      });

    const first = startAttempt();
    await Promise.resolve();
    expect(first.getStatus()).toBe("failed");
    expect(onUiFailure).toHaveBeenCalledTimes(1);
    expect(isApplyConfirmationInFlight("hags")).toBe(false);

    const second = startAttempt();
    await Promise.resolve();
    expect(second.didStart).toBe(true);
    expect(second.getStatus()).toBe("succeeded");
    expect(onUiSuccess).toHaveBeenCalledTimes(1);
    expect(readPendingApplyResult("hags")?.historyEntryId).toBe("entry-retry");
  });

  it("route-param switch: stale attempt persists its own slot without navigating the new page", async () => {
    let resolveStale!: (value: OptimizationApplyResult) => void;
    const staleUiSuccess = vi.fn();
    const currentUiSuccess = vi.fn();

    const stale = startApplyConfirmationLifecycle({
      optimizationId: "windows-search",
      runApply: () =>
        new Promise((resolve) => {
          resolveStale = resolve;
        }),
      persistResult: storePendingApplyResult,
      onUiSuccess: staleUiSuccess,
      onUiFailure: vi.fn()
    });

    // Simulate leaving /confirm/windows-search for /confirm/sysmain.
    stale.dispose();

    storePendingApplyResult(
      buildResult({ optimizationId: "sysmain", historyEntryId: "entry-sysmain-existing" })
    );

    const current = startApplyConfirmationLifecycle({
      optimizationId: "sysmain",
      runApply: async () => buildResult({ optimizationId: "sysmain", historyEntryId: "entry-sysmain-new" }),
      persistResult: storePendingApplyResult,
      onUiSuccess: currentUiSuccess,
      onUiFailure: vi.fn()
    });

    expect(current.didStart).toBe(true);

    resolveStale(buildResult({ optimizationId: "windows-search", historyEntryId: "entry-search-stale" }));
    await Promise.resolve();

    expect(staleUiSuccess).not.toHaveBeenCalled();
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-search-stale");
    expect(readPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-sysmain-new");
    expect(currentUiSuccess).toHaveBeenCalledTimes(1);
    expect(currentUiSuccess.mock.calls[0]?.[0]?.optimizationId).toBe("sysmain");
  });

  it("isolates wrong optimization ids across pending slots during concurrent completes", async () => {
    let resolveA!: (value: OptimizationApplyResult) => void;
    let resolveB!: (value: OptimizationApplyResult) => void;

    const handleA = startApplyConfirmationLifecycle({
      optimizationId: "windows-search",
      runApply: () =>
        new Promise((resolve) => {
          resolveA = resolve;
        }),
      persistResult: storePendingApplyResult,
      onUiSuccess: vi.fn(),
      onUiFailure: vi.fn()
    });

    const handleB = startApplyConfirmationLifecycle({
      optimizationId: "sysmain",
      runApply: () =>
        new Promise((resolve) => {
          resolveB = resolve;
        }),
      persistResult: storePendingApplyResult,
      onUiSuccess: vi.fn(),
      onUiFailure: vi.fn()
    });

    expect(handleA.didStart).toBe(true);
    expect(handleB.didStart).toBe(true);

    resolveB(buildResult({ optimizationId: "sysmain", historyEntryId: "entry-b" }));
    await Promise.resolve();
    resolveA(buildResult({ optimizationId: "windows-search", historyEntryId: "entry-a" }));
    await Promise.resolve();

    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-a");
    expect(readPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-b");
    expect(readPendingApplyResult("hags")).toBeNull();

    clearPendingApplyResult("windows-search");
    expect(readPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-b");
  });

  it("converges synchronous runApply throws to UI failure when still active", async () => {
    const onUiFailure = vi.fn();

    const handle = startApplyConfirmationLifecycle({
      optimizationId: "game-mode",
      runApply: () => {
        throw new Error("Sync apply boom");
      },
      persistResult: vi.fn(),
      onUiSuccess: vi.fn(),
      onUiFailure
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("failed");
    expect(onUiFailure).toHaveBeenCalledWith("Sync apply boom");
    expect(isApplyConfirmationInFlight("game-mode")).toBe(false);
  });

  it("treats one-sided pending-apply storage success as durable (no false UI failure)", async () => {
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.localStorage && key === pendingApplyResultStorageKey) {
        throw new Error("QuotaExceededError");
      }

      return originalSetItem.call(this, key, value);
    });

    const onUiSuccess = vi.fn();
    const onUiFailure = vi.fn();

    const handle = startApplyConfirmationLifecycle({
      optimizationId: "windows-search",
      runApply: async () => buildResult({ historyEntryId: "entry-session-only" }),
      persistResult: storePendingApplyResult,
      onUiSuccess,
      onUiFailure
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("succeeded");
    expect(onUiSuccess).toHaveBeenCalledTimes(1);
    expect(onUiFailure).not.toHaveBeenCalled();
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-session-only");
  });

  it("surfaces dual pending-apply storage failure without navigating as success", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (_key: string) {
      if (_key === pendingApplyResultStorageKey) {
        throw new Error("storage denied");
      }

      throw new Error("unexpected key");
    });

    const onUiSuccess = vi.fn();
    const onUiFailure = vi.fn();

    const handle = startApplyConfirmationLifecycle({
      optimizationId: "windows-search",
      runApply: async () => buildResult({ historyEntryId: "entry-lost" }),
      persistResult: storePendingApplyResult,
      onUiSuccess,
      onUiFailure
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("failed");
    expect(onUiSuccess).not.toHaveBeenCalled();
    expect(onUiFailure).toHaveBeenCalledWith(expect.stringMatching(/Failed to persist pending apply result/));
    expect(readPendingApplyResult("windows-search")).toBeNull();
  });

  it("does not navigate with a stale session history id when only local persist succeeds", async () => {
    const stale = buildResult({ historyEntryId: "entry-stale-session" });
    window.sessionStorage.setItem(pendingApplyResultStorageKey, JSON.stringify({ "windows-search": stale }));

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (this === window.sessionStorage && key === pendingApplyResultStorageKey) {
        throw new Error("QuotaExceededError");
      }

      return originalSetItem.call(this, key, value);
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (this === window.sessionStorage && key === pendingApplyResultStorageKey) {
        throw new Error("session remove blocked");
      }

      return originalRemoveItem.call(this, key);
    });

    const onUiSuccess = vi.fn();
    const onUiFailure = vi.fn();

    const handle = startApplyConfirmationLifecycle({
      optimizationId: "windows-search",
      runApply: async () => buildResult({ historyEntryId: "entry-fresh-local" }),
      persistResult: storePendingApplyResult,
      onUiSuccess,
      onUiFailure
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("succeeded");
    expect(onUiFailure).not.toHaveBeenCalled();
    expect(onUiSuccess).toHaveBeenCalledTimes(1);
    expect(onUiSuccess.mock.calls[0][0].historyEntryId).toBe("entry-fresh-local");
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-fresh-local");
  });

  it("keeps cleared slots hidden after set/remove dual failure without wrong success navigation", async () => {
    storePendingApplyResult(buildResult({ optimizationId: "windows-search", historyEntryId: "entry-old" }));

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    let blockMutations = true;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (blockMutations && key === pendingApplyResultStorageKey) {
        throw new Error("rewrite denied");
      }

      return originalSetItem.call(this, key, value);
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
      if (blockMutations && key === pendingApplyResultStorageKey) {
        throw new Error("remove denied");
      }

      return originalRemoveItem.call(this, key);
    });

    clearPendingApplyResult("windows-search");
    expect(readPendingApplyResult("windows-search")).toBeNull();

    blockMutations = false;
    const onUiSuccess = vi.fn();
    const onUiFailure = vi.fn();

    const handle = startApplyConfirmationLifecycle({
      optimizationId: "windows-search",
      runApply: async () => buildResult({ historyEntryId: "entry-rebuilt" }),
      persistResult: storePendingApplyResult,
      onUiSuccess,
      onUiFailure
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("succeeded");
    expect(onUiFailure).not.toHaveBeenCalled();
    expect(onUiSuccess).toHaveBeenCalledTimes(1);
    expect(onUiSuccess.mock.calls[0][0].historyEntryId).toBe("entry-rebuilt");
    expect(readPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-rebuilt");
  });
});
