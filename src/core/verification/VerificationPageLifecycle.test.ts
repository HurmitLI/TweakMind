import { afterEach, describe, expect, it, vi } from "vitest";
import type { VerificationResult } from "./VerificationResult";
import { startVerificationPageLifecycle } from "./VerificationPageLifecycle";

function buildResult(overrides: Partial<VerificationResult> = {}): VerificationResult {
  return {
    historyEntryId: "entry-1",
    optimizationId: "windows-search",
    status: "Verified",
    previousState: "Running",
    expectedState: "Disabled",
    actualState: "Disabled",
    message: "Verified.",
    timestamp: "1700000000",
    ...overrides
  };
}

describe("startVerificationPageLifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports settled results including terminal Failed without treating them as unexpected success", async () => {
    const onSettled = vi.fn();
    const onUnexpectedFailure = vi.fn();

    const handle = startVerificationPageLifecycle({
      runVerify: async () => buildResult({ status: "Failed", message: "Mismatch" }),
      onSettled,
      onUnexpectedFailure
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("settled");
    expect(onSettled).toHaveBeenCalledWith(expect.objectContaining({ status: "Failed" }));
    expect(onUnexpectedFailure).not.toHaveBeenCalled();
  });

  it("does not invoke settle callbacks after dispose on resolve or reject", async () => {
    let resolveVerify!: (value: VerificationResult) => void;
    let rejectVerify!: (reason?: unknown) => void;
    const onSettled = vi.fn();
    const onUnexpectedFailure = vi.fn();

    const successHandle = startVerificationPageLifecycle({
      runVerify: () =>
        new Promise((resolve) => {
          resolveVerify = resolve;
        }),
      onSettled,
      onUnexpectedFailure
    });

    successHandle.dispose();
    resolveVerify(buildResult());
    await Promise.resolve();

    expect(onSettled).not.toHaveBeenCalled();
    expect(onUnexpectedFailure).not.toHaveBeenCalled();

    const failureHandle = startVerificationPageLifecycle({
      runVerify: () =>
        new Promise((_resolve, reject) => {
          rejectVerify = reject;
        }),
      onSettled,
      onUnexpectedFailure
    });

    failureHandle.dispose();
    rejectVerify(new Error("Late rejection"));
    await Promise.resolve();

    expect(onSettled).not.toHaveBeenCalled();
    expect(onUnexpectedFailure).not.toHaveBeenCalled();
  });

  it("ignores an older out-of-order Promise when a newer attempt is active", async () => {
    let resolveFirst!: (value: VerificationResult) => void;
    let resolveSecond!: (value: VerificationResult) => void;
    const onSettled = vi.fn();
    const onUnexpectedFailure = vi.fn();

    const first = startVerificationPageLifecycle({
      runVerify: () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      onSettled,
      onUnexpectedFailure
    });

    first.dispose();

    const second = startVerificationPageLifecycle({
      runVerify: () =>
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
      onSettled,
      onUnexpectedFailure
    });

    resolveFirst(buildResult({ historyEntryId: "entry-stale", message: "stale" }));
    await Promise.resolve();
    expect(onSettled).not.toHaveBeenCalled();

    resolveSecond(buildResult({ historyEntryId: "entry-current", message: "current" }));
    await Promise.resolve();

    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled.mock.calls[0]?.[0]?.historyEntryId).toBe("entry-current");
    expect(second.getStatus()).toBe("settled");
  });

  it("StrictMode-style dispose + new start does not let the first attempt settle the UI", async () => {
    let resolveFirst!: (value: VerificationResult) => void;
    const runVerify = vi.fn();
    const onSettled = vi.fn();

    runVerify.mockImplementationOnce(
      () =>
        new Promise<VerificationResult>((resolve) => {
          resolveFirst = resolve;
        })
    );
    runVerify.mockImplementationOnce(async () => buildResult({ historyEntryId: "entry-remount" }));

    const first = startVerificationPageLifecycle({
      runVerify,
      onSettled,
      onUnexpectedFailure: vi.fn()
    });

    first.dispose();

    const second = startVerificationPageLifecycle({
      runVerify,
      onSettled,
      onUnexpectedFailure: vi.fn()
    });

    await Promise.resolve();
    expect(runVerify).toHaveBeenCalledTimes(2);
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled.mock.calls[0]?.[0]?.historyEntryId).toBe("entry-remount");

    resolveFirst(buildResult({ historyEntryId: "entry-first" }));
    await Promise.resolve();
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(second.getStatus()).toBe("settled");
  });

  it("converges synchronous and asynchronous unexpected rejections to failed", async () => {
    const onSettled = vi.fn();
    const onUnexpectedFailure = vi.fn();

    const syncHandle = startVerificationPageLifecycle({
      runVerify: () => {
        throw new Error("Sync verify boom");
      },
      onSettled,
      onUnexpectedFailure
    });

    await Promise.resolve();
    expect(syncHandle.getStatus()).toBe("failed");
    expect(onUnexpectedFailure).toHaveBeenCalledWith("Sync verify boom");
    expect(onSettled).not.toHaveBeenCalled();

    let rejectAsync!: (reason?: unknown) => void;
    const asyncHandle = startVerificationPageLifecycle({
      runVerify: () =>
        new Promise((_resolve, reject) => {
          rejectAsync = reject;
        }),
      onSettled,
      onUnexpectedFailure
    });

    rejectAsync(new Error("Async verify boom"));
    await Promise.resolve();
    expect(asyncHandle.getStatus()).toBe("failed");
    expect(onUnexpectedFailure).toHaveBeenCalledWith("Async verify boom");
  });

  it("allows a fresh retry after a previous unexpected failure", async () => {
    const onSettled = vi.fn();
    const onUnexpectedFailure = vi.fn();
    let attempt = 0;

    const startAttempt = () =>
      startVerificationPageLifecycle({
        runVerify: async () => {
          attempt += 1;

          if (attempt === 1) {
            throw new Error("First verify failed");
          }

          return buildResult({ message: "Retry ok" });
        },
        onSettled,
        onUnexpectedFailure
      });

    const first = startAttempt();
    await Promise.resolve();
    expect(first.getStatus()).toBe("failed");
    first.dispose();

    const second = startAttempt();
    await Promise.resolve();
    expect(second.getStatus()).toBe("settled");
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onUnexpectedFailure).toHaveBeenCalledTimes(1);
  });

  it("converges onSettled/commit synchronous throws to onUnexpectedFailure once", async () => {
    const onSettled = vi.fn(() => {
      throw new Error("localStorage quota exceeded");
    });
    const onUnexpectedFailure = vi.fn();

    const handle = startVerificationPageLifecycle({
      runVerify: async () => buildResult(),
      onSettled,
      onUnexpectedFailure
    });

    await Promise.resolve();

    expect(handle.getStatus()).toBe("failed");
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onUnexpectedFailure).toHaveBeenCalledTimes(1);
    expect(onUnexpectedFailure).toHaveBeenCalledWith("localStorage quota exceeded");
  });

  it("does not notify failure for a disposed attempt when onSettled would throw", async () => {
    const onSettled = vi.fn(() => {
      throw new Error("should not run");
    });
    const onUnexpectedFailure = vi.fn();
    let resolveVerify!: (value: VerificationResult) => void;

    const handle = startVerificationPageLifecycle({
      runVerify: () =>
        new Promise((resolve) => {
          resolveVerify = resolve;
        }),
      onSettled,
      onUnexpectedFailure
    });

    handle.dispose();
    resolveVerify(buildResult());
    await Promise.resolve();

    expect(handle.getStatus()).toBe("verifying");
    expect(onSettled).not.toHaveBeenCalled();
    expect(onUnexpectedFailure).not.toHaveBeenCalled();
  });

  it("notifies onSettled throw only once and allows a later retry to succeed", async () => {
    const onUnexpectedFailure = vi.fn();
    let settleAttempts = 0;

    const first = startVerificationPageLifecycle({
      runVerify: async () => buildResult({ message: "first" }),
      onSettled: () => {
        settleAttempts += 1;
        throw new Error("commit failed");
      },
      onUnexpectedFailure
    });

    await Promise.resolve();
    expect(first.getStatus()).toBe("failed");
    expect(onUnexpectedFailure).toHaveBeenCalledTimes(1);
    expect(settleAttempts).toBe(1);
    first.dispose();

    const onSettledRetry = vi.fn();
    const second = startVerificationPageLifecycle({
      runVerify: async () => buildResult({ message: "retry ok" }),
      onSettled: onSettledRetry,
      onUnexpectedFailure
    });

    await Promise.resolve();
    expect(second.getStatus()).toBe("settled");
    expect(onSettledRetry).toHaveBeenCalledTimes(1);
    expect(onUnexpectedFailure).toHaveBeenCalledTimes(1);
    expect(settleAttempts).toBe(1);
  });
});
