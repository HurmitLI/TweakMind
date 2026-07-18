import { afterEach, describe, expect, it, vi } from "vitest";
import { startScanPageLifecycle } from "./ScanPageLifecycle";

describe("startScanPageLifecycle", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reports success and navigates after a completed scan reaches 100%", async () => {
    vi.useFakeTimers();

    const onProgress = vi.fn();
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();

    const handle = startScanPageLifecycle({
      runScan: async ({ onProgress: reportScanProgress }) => {
        reportScanProgress(40);
      },
      scanDurationMs: 1000,
      scanTickMs: 100,
      successNavigateDelayMs: 200,
      onProgress,
      onSucceeded,
      onFailed
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("succeeded");

    await vi.advanceTimersByTimeAsync(1000);
    expect(onProgress).toHaveBeenCalledWith(100);

    await vi.advanceTimersByTimeAsync(200);
    expect(onSucceeded).toHaveBeenCalledTimes(1);
    expect(onFailed).not.toHaveBeenCalled();

    handle.dispose();
  });

  it("converges synchronous rejections to failed without navigating", async () => {
    vi.useFakeTimers();

    const onProgress = vi.fn();
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();

    const handle = startScanPageLifecycle({
      runScan: () => {
        throw new Error("Sync invoke failure");
      },
      scanDurationMs: 1000,
      scanTickMs: 100,
      successNavigateDelayMs: 200,
      onProgress,
      onSucceeded,
      onFailed
    });

    await Promise.resolve();
    expect(handle.getStatus()).toBe("failed");
    expect(onFailed).toHaveBeenCalledWith("Sync invoke failure");
    expect(onSucceeded).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1500);
    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onFailed).toHaveBeenCalledTimes(1);

    handle.dispose();
  });

  it("converges asynchronous rejections after progress hits 100%", async () => {
    vi.useFakeTimers();

    let rejectScan!: (reason?: unknown) => void;
    const onProgress = vi.fn();
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();

    const handle = startScanPageLifecycle({
      runScan: () =>
        new Promise((_resolve, reject) => {
          rejectScan = reject;
        }),
      scanDurationMs: 500,
      scanTickMs: 100,
      successNavigateDelayMs: 200,
      onProgress,
      onSucceeded,
      onFailed
    });

    await vi.advanceTimersByTimeAsync(500);
    expect(onProgress).toHaveBeenCalledWith(100);
    expect(handle.getStatus()).toBe("scanning");
    expect(onSucceeded).not.toHaveBeenCalled();

    rejectScan(new Error("Async store failure"));
    await Promise.resolve();

    expect(handle.getStatus()).toBe("failed");
    expect(onFailed).toHaveBeenCalledWith("Async store failure");

    await vi.advanceTimersByTimeAsync(1000);
    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onFailed).toHaveBeenCalledTimes(1);

    handle.dispose();
  });

  it("allows a safe retry after a previous hard failure", async () => {
    vi.useFakeTimers();

    const onProgress = vi.fn();
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();
    let attempt = 0;

    const startAttempt = () =>
      startScanPageLifecycle({
        runScan: async ({ onProgress: reportScanProgress }) => {
          attempt += 1;

          if (attempt === 1) {
            throw new Error("First attempt failed");
          }

          reportScanProgress(100);
        },
        scanDurationMs: 400,
        scanTickMs: 100,
        successNavigateDelayMs: 100,
        onProgress,
        onSucceeded,
        onFailed
      });

    const first = startAttempt();
    await Promise.resolve();
    expect(first.getStatus()).toBe("failed");
    expect(onFailed).toHaveBeenCalledWith("First attempt failed");
    first.dispose();

    const second = startAttempt();
    await Promise.resolve();
    expect(second.getStatus()).toBe("succeeded");

    await vi.advanceTimersByTimeAsync(400);
    await vi.advanceTimersByTimeAsync(100);
    expect(onSucceeded).toHaveBeenCalledTimes(1);
    expect(onFailed).toHaveBeenCalledTimes(1);

    second.dispose();
  });

  it("does not update status callbacks after dispose", async () => {
    vi.useFakeTimers();

    let resolveScan!: () => void;
    let rejectScan!: (reason?: unknown) => void;
    const onProgress = vi.fn();
    const onSucceeded = vi.fn();
    const onFailed = vi.fn();

    const successHandle = startScanPageLifecycle({
      runScan: () =>
        new Promise((resolve) => {
          resolveScan = () => resolve(undefined);
        }),
      scanDurationMs: 1000,
      scanTickMs: 100,
      successNavigateDelayMs: 100,
      onProgress,
      onSucceeded,
      onFailed
    });

    successHandle.dispose();
    resolveScan();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(500);

    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onFailed).not.toHaveBeenCalled();

    const failureHandle = startScanPageLifecycle({
      runScan: () =>
        new Promise((_resolve, reject) => {
          rejectScan = reject;
        }),
      scanDurationMs: 1000,
      scanTickMs: 100,
      successNavigateDelayMs: 100,
      onProgress,
      onSucceeded,
      onFailed
    });

    failureHandle.dispose();
    rejectScan(new Error("Late rejection"));
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(500);

    expect(onSucceeded).not.toHaveBeenCalled();
    expect(onFailed).not.toHaveBeenCalled();
  });
});
