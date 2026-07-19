import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearPendingRecoveryAuthorization,
  hasPendingRecoveryAuthorization,
  storePendingRecoveryAuthorization,
  type OptimizationRecoveryResult
} from "../windows/WindowsOptimizationService";
import {
  getRecoveryConfirmationHref,
  hasInFlightRecoveryLifecycle,
  resetRecoveryPageLifecycleForTests,
  startRecoveryPageLifecycle,
  subscribeRecoveryPageLifecycle
} from "./RecoveryPageLifecycle";

function buildResult(overrides: Partial<OptimizationRecoveryResult> = {}): OptimizationRecoveryResult {
  return {
    historyEntryId: "entry-1",
    optimizationId: "sysmain",
    status: "success",
    previousState: "Disabled",
    expectedState: "Enabled",
    actualState: "Enabled",
    error: null,
    timestamp: "1710000000",
    ...overrides
  };
}

describe("startRecoveryPageLifecycle", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    resetRecoveryPageLifecycleForTests();
  });

  it("reports success after restore settles and progress can reach 100%", async () => {
    vi.useFakeTimers();

    const onProgress = vi.fn();
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();

    const handle = startRecoveryPageLifecycle({
      runRestore: async () => buildResult(),
      recoveryDurationMs: 1000,
      recoveryTickMs: 100,
      onProgress,
      onSucceeded,
      onFailed
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("succeeded");
    expect(onSucceeded).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(100);
    expect(onFailed).not.toHaveBeenCalled();

    handle.dispose();
  });

  it("converges hard-failed restore results without treating them as success", async () => {
    vi.useFakeTimers();

    const onProgress = vi.fn();
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();
    const failed = buildResult({
      status: "failed",
      actualState: "Unknown",
      error: "Snapshot missing"
    });

    const handle = startRecoveryPageLifecycle({
      runRestore: async () => failed,
      recoveryDurationMs: 1000,
      recoveryTickMs: 100,
      onProgress,
      onSucceeded,
      onFailed
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("failed");
    expect(onFailed).toHaveBeenCalledWith({ kind: "result", result: failed });
    expect(onSucceeded).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1500);
    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onFailed).toHaveBeenCalledTimes(1);

    handle.dispose();
  });

  it("converges asynchronous rejections after progress hits 100%", async () => {
    vi.useFakeTimers();

    let rejectRestore!: (reason?: unknown) => void;
    const onProgress = vi.fn();
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();

    const handle = startRecoveryPageLifecycle({
      runRestore: () =>
        new Promise((_resolve, reject) => {
          rejectRestore = reject;
        }),
      recoveryDurationMs: 500,
      recoveryTickMs: 100,
      onProgress,
      onSucceeded,
      onFailed
    });

    await vi.advanceTimersByTimeAsync(500);
    expect(onProgress).toHaveBeenCalledWith(100);
    expect(handle.getStatus()).toBe("recovering");
    expect(onSucceeded).not.toHaveBeenCalled();

    rejectRestore(new Error("Async restore failure"));
    await Promise.resolve();

    expect(handle.getStatus()).toBe("failed");
    expect(onFailed).toHaveBeenCalledWith({
      kind: "unexpected",
      errorMessage: "Async restore failure"
    });
    expect(onSucceeded).not.toHaveBeenCalled();

    handle.dispose();
  });

  it("converges synchronous rejections to failed", async () => {
    vi.useFakeTimers();

    const onProgress = vi.fn();
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();

    const handle = startRecoveryPageLifecycle({
      runRestore: () => {
        throw new Error("Sync restore failure");
      },
      recoveryDurationMs: 1000,
      recoveryTickMs: 100,
      onProgress,
      onSucceeded,
      onFailed
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("failed");
    expect(onFailed).toHaveBeenCalledWith({
      kind: "unexpected",
      errorMessage: "Sync restore failure"
    });
    expect(onSucceeded).not.toHaveBeenCalled();

    handle.dispose();
  });

  it("does not invoke settle callbacks after dispose on resolve or reject", async () => {
    vi.useFakeTimers();

    let resolveRestore!: (value: OptimizationRecoveryResult) => void;
    let rejectRestore!: (reason?: unknown) => void;
    const onProgress = vi.fn();
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();

    const successHandle = startRecoveryPageLifecycle({
      runRestore: () =>
        new Promise((resolve) => {
          resolveRestore = resolve;
        }),
      recoveryDurationMs: 1000,
      recoveryTickMs: 100,
      onProgress,
      onSucceeded,
      onFailed
    });

    successHandle.dispose();
    resolveRestore(buildResult());
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(500);

    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onFailed).not.toHaveBeenCalled();

    const failureHandle = startRecoveryPageLifecycle({
      runRestore: () =>
        new Promise((_resolve, reject) => {
          rejectRestore = reject;
        }),
      recoveryDurationMs: 1000,
      recoveryTickMs: 100,
      onProgress,
      onSucceeded,
      onFailed
    });

    failureHandle.dispose();
    rejectRestore(new Error("Late rejection"));
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(500);

    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onFailed).not.toHaveBeenCalled();
  });

  it("does not report success while progress is already 100% but restore is still open", async () => {
    vi.useFakeTimers();

    let resolveRestore!: (value: OptimizationRecoveryResult) => void;
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();

    const handle = startRecoveryPageLifecycle({
      runRestore: () =>
        new Promise((resolve) => {
          resolveRestore = resolve;
        }),
      recoveryDurationMs: 500,
      recoveryTickMs: 100,
      onProgress: vi.fn(),
      onSucceeded,
      onFailed
    });

    await vi.advanceTimersByTimeAsync(500);
    expect(handle.getStatus()).toBe("recovering");
    expect(onSucceeded).not.toHaveBeenCalled();

    resolveRestore(buildResult({ status: "failed", error: "late hard failure" }));
    await Promise.resolve();

    expect(handle.getStatus()).toBe("failed");
    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(onSucceeded).not.toHaveBeenCalled();

    handle.dispose();
  });
});

describe("subscribeRecoveryPageLifecycle authorization safety", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    resetRecoveryPageLifecycleForTests();
    clearPendingRecoveryAuthorization();
  });

  it("ordinary dispose / navigation leave does not re-arm recovery authorization", async () => {
    storePendingRecoveryAuthorization("entry-1");

    const runRestore = vi.fn(
      () =>
        new Promise<OptimizationRecoveryResult>(() => {
          /* leave in-flight */
        })
    );

    const first = subscribeRecoveryPageLifecycle({
      historyEntryId: "entry-1",
      runRestore,
      recoveryDurationMs: 1000,
      recoveryTickMs: 100,
      onStartFresh() {
        clearPendingRecoveryAuthorization();
      },
      onProgress: vi.fn(),
      onSucceeded: vi.fn(),
      onFailed: vi.fn()
    });

    expect(first.didStartFresh).toBe(true);
    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);
    expect(hasInFlightRecoveryLifecycle("entry-1")).toBe(true);

    // Real route leave: unsubscribe and let deferred teardown run (no resubscribe).
    first.unsubscribe();
    await Promise.resolve();

    expect(hasInFlightRecoveryLifecycle("entry-1")).toBe(false);
    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);
    expect(runRestore).toHaveBeenCalledTimes(1);
  });

  it("StrictMode-style dispose + resubscribe does not call runRestore twice and never rewrites auth", async () => {
    storePendingRecoveryAuthorization("entry-1");

    let resolveRestore!: (value: OptimizationRecoveryResult) => void;
    const runRestore = vi.fn(
      () =>
        new Promise<OptimizationRecoveryResult>((resolve) => {
          resolveRestore = resolve;
        })
    );
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();

    const first = subscribeRecoveryPageLifecycle({
      historyEntryId: "entry-1",
      runRestore,
      recoveryDurationMs: 1000,
      recoveryTickMs: 100,
      onStartFresh() {
        clearPendingRecoveryAuthorization();
      },
      onProgress: vi.fn(),
      onSucceeded,
      onFailed
    });

    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);

    // StrictMode: cleanup then setup in the same turn before microtask teardown.
    first.unsubscribe();
    expect(hasInFlightRecoveryLifecycle("entry-1")).toBe(true);

    const second = subscribeRecoveryPageLifecycle({
      historyEntryId: "entry-1",
      runRestore,
      recoveryDurationMs: 1000,
      recoveryTickMs: 100,
      onStartFresh() {
        clearPendingRecoveryAuthorization();
        storePendingRecoveryAuthorization("entry-1");
      },
      onProgress: vi.fn(),
      onSucceeded,
      onFailed
    });

    expect(second.didStartFresh).toBe(false);
    expect(runRestore).toHaveBeenCalledTimes(1);
    // onStartFresh must not run again, so auth stays consumed.
    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);

    await Promise.resolve();
    expect(hasInFlightRecoveryLifecycle("entry-1")).toBe(true);

    resolveRestore(buildResult());
    await Promise.resolve();

    expect(onSucceeded).toHaveBeenCalledTimes(1);
    expect(onFailed).not.toHaveBeenCalled();

    second.unsubscribe();
    await Promise.resolve();
    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);
  });

  it("hard failure leaves authorization cleared and retry href points at the confirmation page", async () => {
    storePendingRecoveryAuthorization("entry-1");

    const onSucceeded = vi.fn();
    const onFailed = vi.fn();

    const subscription = subscribeRecoveryPageLifecycle({
      historyEntryId: "entry-1",
      runRestore: async () => buildResult({ status: "failed", error: "hard fail" }),
      recoveryDurationMs: 400,
      recoveryTickMs: 100,
      onStartFresh() {
        clearPendingRecoveryAuthorization();
      },
      onProgress: vi.fn(),
      onSucceeded,
      onFailed
    });

    await Promise.resolve();
    expect(subscription.getStatus()).toBe("failed");
    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onFailed).toHaveBeenCalledTimes(1);
    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);
    expect(getRecoveryConfirmationHref("entry-1")).toBe("/recover/entry-1");

    subscription.unsubscribe();
    await Promise.resolve();
    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);
    expect(hasInFlightRecoveryLifecycle("entry-1")).toBe(false);
  });

  it("unsubscribed subscribers do not receive late Promise settle updates", async () => {
    let resolveRestore!: (value: OptimizationRecoveryResult) => void;
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();

    const subscription = subscribeRecoveryPageLifecycle({
      historyEntryId: "entry-late",
      runRestore: () =>
        new Promise((resolve) => {
          resolveRestore = resolve;
        }),
      recoveryDurationMs: 1000,
      recoveryTickMs: 100,
      onProgress: vi.fn(),
      onSucceeded,
      onFailed
    });

    subscription.unsubscribe();
    await Promise.resolve();

    resolveRestore(buildResult({ historyEntryId: "entry-late" }));
    await Promise.resolve();

    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onFailed).not.toHaveBeenCalled();
    expect(hasInFlightRecoveryLifecycle("entry-late")).toBe(false);
  });

  it("failed restore does not invoke onSucceeded (no pending success write path)", async () => {
    const onSucceeded = vi.fn();

    const subscription = subscribeRecoveryPageLifecycle({
      historyEntryId: "entry-fail",
      runRestore: async () => buildResult({ status: "failed", error: "nope" }),
      recoveryDurationMs: 400,
      recoveryTickMs: 100,
      onProgress: vi.fn(),
      onSucceeded,
      onFailed: vi.fn()
    });

    await Promise.resolve();
    expect(onSucceeded).not.toHaveBeenCalled();
    subscription.unsubscribe();
    await Promise.resolve();
  });
});
