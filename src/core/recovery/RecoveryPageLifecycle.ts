import type { OptimizationRecoveryResult } from "../windows/WindowsOptimizationService";

export type RecoveryPageLifecycleStatus = "recovering" | "succeeded" | "failed";

export type RecoveryPageLifecycleFailure =
  | { kind: "result"; result: OptimizationRecoveryResult }
  | { kind: "unexpected"; errorMessage: string };

export interface RecoveryPageLifecycleOptions {
  /** Starts the underlying restore. May return a rejecting promise or throw synchronously. */
  runRestore: () => Promise<OptimizationRecoveryResult>;
  recoveryDurationMs: number;
  recoveryTickMs: number;
  now?: () => number;
  setIntervalFn?: (handler: () => void, timeout: number) => ReturnType<typeof setInterval>;
  clearIntervalFn?: (id: ReturnType<typeof setInterval>) => void;
  onProgress: (progress: number) => void;
  onSucceeded: (result: OptimizationRecoveryResult) => void;
  onFailed: (failure: RecoveryPageLifecycleFailure) => void;
  /** Called from dispose() only while still recovering (e.g. StrictMode remount). */
  onDisposeWhileRecovering?: () => void;
}

export interface RecoveryPageLifecycleHandle {
  dispose: () => void;
  getStatus: () => RecoveryPageLifecycleStatus;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const asString = String(error ?? "").trim();
  return asString || "Recovery failed unexpectedly.";
}

/**
 * Owns the RecoveryPage restore Promise + progress animation lifecycle so hard
 * failures converge to a failed state, and dispose stops post-unmount updates.
 */
export function startRecoveryPageLifecycle(options: RecoveryPageLifecycleOptions): RecoveryPageLifecycleHandle {
  const now = options.now ?? Date.now;
  const setIntervalFn = options.setIntervalFn ?? setInterval;
  const clearIntervalFn = options.clearIntervalFn ?? clearInterval;

  let disposed = false;
  let status: RecoveryPageLifecycleStatus = "recovering";
  let intervalId: ReturnType<typeof setInterval> | undefined;
  const startedAt = now();

  const clearTimers = () => {
    if (intervalId !== undefined) {
      clearIntervalFn(intervalId);
      intervalId = undefined;
    }
  };

  const markSucceeded = (result: OptimizationRecoveryResult) => {
    if (disposed || status !== "recovering") {
      return;
    }

    status = "succeeded";
    clearTimers();
    options.onProgress(100);
    options.onSucceeded(result);
  };

  const markFailed = (failure: RecoveryPageLifecycleFailure) => {
    if (disposed || status !== "recovering") {
      return;
    }

    status = "failed";
    clearTimers();
    options.onFailed(failure);
  };

  let restorePromise: Promise<OptimizationRecoveryResult>;

  try {
    restorePromise = options.runRestore();
  } catch (error) {
    restorePromise = Promise.reject(error);
  }

  void restorePromise.then(
    (result) => {
      if (result.status === "success") {
        markSucceeded(result);
        return;
      }

      markFailed({ kind: "result", result });
    },
    (error: unknown) => {
      markFailed({ kind: "unexpected", errorMessage: toErrorMessage(error) });
    }
  );

  intervalId = setIntervalFn(() => {
    if (disposed || status === "failed") {
      return;
    }

    const elapsed = now() - startedAt;
    const nextProgress = Math.min(100, Math.round((elapsed / options.recoveryDurationMs) * 100));
    options.onProgress(nextProgress);

    if (nextProgress < 100) {
      return;
    }

    if (intervalId !== undefined) {
      clearIntervalFn(intervalId);
      intervalId = undefined;
    }

    // Wait for the restore Promise. A later failure must converge to failed
    // instead of leaving a false completed/success presentation.
  }, options.recoveryTickMs);

  return {
    dispose() {
      if (disposed) {
        return;
      }

      const wasRecovering = status === "recovering";
      disposed = true;
      clearTimers();

      if (wasRecovering) {
        options.onDisposeWhileRecovering?.();
      }
    },
    getStatus() {
      return status;
    }
  };
}
