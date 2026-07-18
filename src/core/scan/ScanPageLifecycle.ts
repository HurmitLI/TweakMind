export type ScanPageLifecycleStatus = "scanning" | "succeeded" | "failed";

export interface ScanPageLifecycleOptions {
  /** Starts the underlying scan. May return a rejecting promise or throw synchronously. */
  runScan: (handlers: { onProgress: (progress: number) => void }) => Promise<unknown>;
  scanDurationMs: number;
  scanTickMs: number;
  successNavigateDelayMs?: number;
  now?: () => number;
  setIntervalFn?: (handler: () => void, timeout: number) => ReturnType<typeof setInterval>;
  clearIntervalFn?: (id: ReturnType<typeof setInterval>) => void;
  setTimeoutFn?: (handler: () => void, timeout: number) => ReturnType<typeof setTimeout>;
  clearTimeoutFn?: (id: ReturnType<typeof setTimeout>) => void;
  onProgress: (progress: number) => void;
  onSucceeded: () => void;
  onFailed: (errorMessage: string) => void;
}

export interface ScanPageLifecycleHandle {
  dispose: () => void;
  getStatus: () => ScanPageLifecycleStatus;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const asString = String(error ?? "").trim();
  return asString || "Scan failed unexpectedly.";
}

/**
 * Owns the ScanPage scan Promise + progress animation lifecycle so hard
 * failures converge to a failed state instead of leaving the UI stuck at 100%.
 */
export function startScanPageLifecycle(options: ScanPageLifecycleOptions): ScanPageLifecycleHandle {
  const now = options.now ?? Date.now;
  const setIntervalFn = options.setIntervalFn ?? setInterval;
  const clearIntervalFn = options.clearIntervalFn ?? clearInterval;
  const setTimeoutFn = options.setTimeoutFn ?? setTimeout;
  const clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout;
  const successNavigateDelayMs = options.successNavigateDelayMs ?? 650;

  let disposed = false;
  let status: ScanPageLifecycleStatus = "scanning";
  let scanProgress = 0;
  let intervalId: ReturnType<typeof setInterval> | undefined;
  let navigateTimeoutId: ReturnType<typeof setTimeout> | undefined;
  const startedAt = now();

  const clearTimers = () => {
    if (intervalId !== undefined) {
      clearIntervalFn(intervalId);
      intervalId = undefined;
    }

    if (navigateTimeoutId !== undefined) {
      clearTimeoutFn(navigateTimeoutId);
      navigateTimeoutId = undefined;
    }
  };

  const scheduleSuccessNavigation = () => {
    if (disposed || status !== "succeeded") {
      return;
    }

    if (navigateTimeoutId !== undefined) {
      return;
    }

    navigateTimeoutId = setTimeoutFn(() => {
      navigateTimeoutId = undefined;

      if (disposed || status !== "succeeded") {
        return;
      }

      options.onSucceeded();
    }, successNavigateDelayMs);
  };

  const markSucceeded = () => {
    if (disposed || status !== "scanning") {
      return;
    }

    status = "succeeded";
    options.onProgress(100);

    if (now() - startedAt >= options.scanDurationMs) {
      clearTimers();
      scheduleSuccessNavigation();
    }
  };

  const markFailed = (error: unknown) => {
    if (disposed || status !== "scanning") {
      return;
    }

    status = "failed";
    clearTimers();
    options.onFailed(toErrorMessage(error));
  };

  let scanPromise: Promise<unknown>;

  try {
    scanPromise = options.runScan({
      onProgress(progress) {
        if (disposed || status !== "scanning") {
          return;
        }

        scanProgress = progress;
      }
    });
  } catch (error) {
    scanPromise = Promise.reject(error);
  }

  void scanPromise.then(
    () => {
      markSucceeded();
    },
    (error: unknown) => {
      markFailed(error);
    }
  );

  intervalId = setIntervalFn(() => {
    if (disposed || status === "failed") {
      return;
    }

    const elapsed = now() - startedAt;
    const animatedProgress = Math.min(100, Math.round((elapsed / options.scanDurationMs) * 100));
    const nextProgress = Math.min(100, Math.max(animatedProgress, scanProgress));
    options.onProgress(nextProgress);

    if (nextProgress < 100) {
      return;
    }

    if (intervalId !== undefined) {
      clearIntervalFn(intervalId);
      intervalId = undefined;
    }

    if (status === "succeeded") {
      scheduleSuccessNavigation();
    }
    // If the scan Promise has not settled yet, wait for its then/catch.
    // A later rejection must converge to failed instead of navigating.
  }, options.scanTickMs);

  return {
    dispose() {
      disposed = true;
      clearTimers();
    },
    getStatus() {
      return status;
    }
  };
}
