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
}

export interface RecoveryPageLifecycleHandle {
  dispose: () => void;
  getStatus: () => RecoveryPageLifecycleStatus;
}

export interface SubscribeRecoveryPageLifecycleOptions extends RecoveryPageLifecycleOptions {
  historyEntryId: string;
  /** Invoked only when a new in-flight restore is created (not on StrictMode resubscribe). */
  onStartFresh?: () => void;
}

export interface RecoveryPageLifecycleSubscription {
  unsubscribe: () => void;
  getStatus: () => RecoveryPageLifecycleStatus;
  didStartFresh: boolean;
}

type Subscriber = {
  onProgress: (progress: number) => void;
  onSucceeded: (result: OptimizationRecoveryResult) => void;
  onFailed: (failure: RecoveryPageLifecycleFailure) => void;
};

type Settlement =
  | { kind: "success"; result: OptimizationRecoveryResult }
  | { kind: "failed"; failure: RecoveryPageLifecycleFailure };

type InFlightSession = {
  handle: RecoveryPageLifecycleHandle;
  subscribers: Set<Subscriber>;
  /** Bumped when a subscriber joins or leaves; stale teardowns no-op. */
  epoch: number;
  lastProgress: number;
  settlement: Settlement | null;
};

const inflightByHistoryEntryId = new Map<string, InFlightSession>();

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const asString = String(error ?? "").trim();
  return asString || "Recovery failed unexpectedly.";
}

/** Confirmation-page retry target; never point retries at /recovery directly. */
export function getRecoveryConfirmationHref(historyEntryId: string): string {
  return `/recover/${historyEntryId}`;
}

export function hasInFlightRecoveryLifecycle(historyEntryId: string): boolean {
  return inflightByHistoryEntryId.has(historyEntryId);
}

/** Test-only: drop in-flight sessions so cases do not leak across files. */
export function resetRecoveryPageLifecycleForTests(): void {
  for (const session of inflightByHistoryEntryId.values()) {
    session.handle.dispose();
  }

  inflightByHistoryEntryId.clear();
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

      disposed = true;
      clearTimers();
    },
    getStatus() {
      return status;
    }
  };
}

/**
 * historyEntryId-keyed subscribe API for RecoveryPage.
 *
 * StrictMode: effect cleanup unsubscribes, then the remount resubscribes in the
 * same turn and joins the existing in-flight restore (no second runRestore, no
 * authorization rewrite). Real navigation: the deferred teardown disposes the
 * session without re-arming confirmation auth.
 */
export function subscribeRecoveryPageLifecycle(
  options: SubscribeRecoveryPageLifecycleOptions
): RecoveryPageLifecycleSubscription {
  let session = inflightByHistoryEntryId.get(options.historyEntryId);
  let didStartFresh = false;

  if (!session) {
    didStartFresh = true;
    options.onStartFresh?.();

    const subscribers = new Set<Subscriber>();
    const created: InFlightSession = {
      subscribers,
      epoch: 0,
      lastProgress: 0,
      settlement: null,
      handle: startRecoveryPageLifecycle({
        runRestore: options.runRestore,
        recoveryDurationMs: options.recoveryDurationMs,
        recoveryTickMs: options.recoveryTickMs,
        now: options.now,
        setIntervalFn: options.setIntervalFn,
        clearIntervalFn: options.clearIntervalFn,
        onProgress(progress) {
          created.lastProgress = progress;

          for (const subscriber of subscribers) {
            subscriber.onProgress(progress);
          }
        },
        onSucceeded(result) {
          created.settlement = { kind: "success", result };
          created.lastProgress = 100;

          for (const subscriber of subscribers) {
            subscriber.onSucceeded(result);
          }
        },
        onFailed(failure) {
          created.settlement = { kind: "failed", failure };

          for (const subscriber of subscribers) {
            subscriber.onFailed(failure);
          }
        }
      })
    };

    session = created;
    inflightByHistoryEntryId.set(options.historyEntryId, session);
  } else {
    // Cancel any deferred teardown scheduled by a StrictMode cleanup.
    session.epoch += 1;
  }

  const subscriber: Subscriber = {
    onProgress: options.onProgress,
    onSucceeded: options.onSucceeded,
    onFailed: options.onFailed
  };

  session.subscribers.add(subscriber);

  if (session.lastProgress > 0) {
    options.onProgress(session.lastProgress);
  }

  if (session.settlement?.kind === "success") {
    options.onSucceeded(session.settlement.result);
  } else if (session.settlement?.kind === "failed") {
    options.onFailed(session.settlement.failure);
  }

  const historyEntryId = options.historyEntryId;

  return {
    didStartFresh,
    getStatus() {
      return session!.handle.getStatus();
    },
    unsubscribe() {
      const active = inflightByHistoryEntryId.get(historyEntryId);

      if (!active || active !== session) {
        return;
      }

      active.subscribers.delete(subscriber);

      if (active.subscribers.size > 0) {
        return;
      }

      const epochAtSchedule = active.epoch;
      queueMicrotask(() => {
        const current = inflightByHistoryEntryId.get(historyEntryId);

        if (!current || current !== active) {
          return;
        }

        if (current.subscribers.size > 0 || current.epoch !== epochAtSchedule) {
          return;
        }

        current.handle.dispose();
        inflightByHistoryEntryId.delete(historyEntryId);
      });
    }
  };
}
