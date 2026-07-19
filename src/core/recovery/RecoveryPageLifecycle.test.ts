import { afterEach, describe, expect, it, vi } from "vitest";
import type { OptimizationRecoveryResult } from "../windows/WindowsOptimizationService";
import { startRecoveryPageLifecycle } from "./RecoveryPageLifecycle";

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
    const onDisposeWhileRecovering = vi.fn();

    const successHandle = startRecoveryPageLifecycle({
      runRestore: () =>
        new Promise((resolve) => {
          resolveRestore = resolve;
        }),
      recoveryDurationMs: 1000,
      recoveryTickMs: 100,
      onProgress,
      onSucceeded,
      onFailed,
      onDisposeWhileRecovering
    });

    successHandle.dispose();
    expect(onDisposeWhileRecovering).toHaveBeenCalledTimes(1);
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
      onFailed,
      onDisposeWhileRecovering
    });

    failureHandle.dispose();
    rejectRestore(new Error("Late rejection"));
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(500);

    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onFailed).not.toHaveBeenCalled();
    expect(onDisposeWhileRecovering).toHaveBeenCalledTimes(2);
  });

  it("does not restore authorization dispose hook after a settled failure", async () => {
    vi.useFakeTimers();

    const onDisposeWhileRecovering = vi.fn();
    const handle = startRecoveryPageLifecycle({
      runRestore: async () => buildResult({ status: "failed", error: "nope" }),
      recoveryDurationMs: 400,
      recoveryTickMs: 100,
      onProgress: vi.fn(),
      onSucceeded: vi.fn(),
      onFailed: vi.fn(),
      onDisposeWhileRecovering
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("failed");
    handle.dispose();
    expect(onDisposeWhileRecovering).not.toHaveBeenCalled();
  });

  it("allows a fresh attempt after a previous hard failure (retry path)", async () => {
    vi.useFakeTimers();

    const onProgress = vi.fn();
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();
    let attempt = 0;

    const startAttempt = () =>
      startRecoveryPageLifecycle({
        runRestore: async () => {
          attempt += 1;

          if (attempt === 1) {
            return buildResult({ status: "failed", error: "First attempt failed" });
          }

          return buildResult();
        },
        recoveryDurationMs: 400,
        recoveryTickMs: 100,
        onProgress,
        onSucceeded,
        onFailed
      });

    const first = startAttempt();
    await Promise.resolve();
    expect(first.getStatus()).toBe("failed");
    first.dispose();

    const second = startAttempt();
    await Promise.resolve();
    expect(second.getStatus()).toBe("succeeded");
    expect(onSucceeded).toHaveBeenCalledTimes(1);
    expect(onFailed).toHaveBeenCalledTimes(1);

    second.dispose();
  });

  it("StrictMode-style remount: dispose re-arms auth hook and ignores stale resolve", async () => {
    vi.useFakeTimers();

    let resolveFirst!: (value: OptimizationRecoveryResult) => void;
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();
    const onDisposeWhileRecovering = vi.fn();

    const first = startRecoveryPageLifecycle({
      runRestore: () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      recoveryDurationMs: 1000,
      recoveryTickMs: 100,
      onProgress: vi.fn(),
      onSucceeded,
      onFailed,
      onDisposeWhileRecovering
    });

    first.dispose();
    expect(onDisposeWhileRecovering).toHaveBeenCalledTimes(1);

    const second = startRecoveryPageLifecycle({
      runRestore: async () => buildResult({ historyEntryId: "entry-remount" }),
      recoveryDurationMs: 1000,
      recoveryTickMs: 100,
      onProgress: vi.fn(),
      onSucceeded,
      onFailed,
      onDisposeWhileRecovering
    });

    resolveFirst(buildResult({ historyEntryId: "entry-stale" }));
    await Promise.resolve();

    expect(onSucceeded).toHaveBeenCalledTimes(1);
    expect(onSucceeded.mock.calls[0]?.[0]?.historyEntryId).toBe("entry-remount");
    expect(onFailed).not.toHaveBeenCalled();

    second.dispose();
    // Second already succeeded before dispose, so auth re-arm must not run again.
    expect(onDisposeWhileRecovering).toHaveBeenCalledTimes(1);
  });

  it("failed settle leaves authorization cleared so retry must re-confirm", async () => {
    vi.useFakeTimers();

    const {
      clearPendingRecoveryAuthorization,
      hasPendingRecoveryAuthorization,
      storePendingRecoveryAuthorization
    } = await import("../windows/WindowsOptimizationService");

    storePendingRecoveryAuthorization("entry-1");
    clearPendingRecoveryAuthorization();

    const handle = startRecoveryPageLifecycle({
      runRestore: async () => buildResult({ status: "failed", error: "hard fail" }),
      recoveryDurationMs: 400,
      recoveryTickMs: 100,
      onProgress: vi.fn(),
      onSucceeded: vi.fn(),
      onFailed: vi.fn(),
      onDisposeWhileRecovering() {
        storePendingRecoveryAuthorization("entry-1");
      }
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("failed");
    handle.dispose();

    expect(hasPendingRecoveryAuthorization("entry-1")).toBe(false);
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



