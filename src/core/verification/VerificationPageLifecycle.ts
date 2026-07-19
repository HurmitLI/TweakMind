import type { VerificationResult } from "./VerificationResult";

export type VerificationPageLifecycleStatus = "verifying" | "settled" | "failed";

export interface VerificationPageLifecycleOptions {
  /** Starts verification. May return a rejecting promise or throw synchronously. */
  runVerify: () => Promise<VerificationResult>;
  onSettled: (result: VerificationResult) => void;
  onUnexpectedFailure: (errorMessage: string) => void;
}

export interface VerificationPageLifecycleHandle {
  dispose: () => void;
  getStatus: () => VerificationPageLifecycleStatus;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const asString = String(error ?? "").trim();
  return asString || "Verification failed unexpectedly.";
}

/**
 * Owns one VerificationPage verify Promise so dispose/param switches ignore
 * stale settles. Callers should run verify with commitSideEffects: false and
 * commit only from onSettled while this handle is still active.
 *
 * onSettled/commit synchronous throws are captured and converged to
 * onUnexpectedFailure so the page cannot stay stuck in verifying.
 */
export function startVerificationPageLifecycle(
  options: VerificationPageLifecycleOptions
): VerificationPageLifecycleHandle {
  let disposed = false;
  let status: VerificationPageLifecycleStatus = "verifying";

  const notifyUnexpectedFailure = (error: unknown) => {
    if (disposed || status !== "verifying") {
      return;
    }

    status = "failed";

    try {
      options.onUnexpectedFailure(toErrorMessage(error));
    } catch {
      // Failure presentation must not escape as an unhandled rejection.
    }
  };

  const markSettled = (result: VerificationResult) => {
    if (disposed || status !== "verifying") {
      return;
    }

    try {
      options.onSettled(result);
    } catch (error) {
      // Commit/presentation threw: converge to a retryable unexpected failure
      // without leaving status stuck on verifying or settled.
      notifyUnexpectedFailure(error);
      return;
    }

    if (disposed || status !== "verifying") {
      return;
    }

    status = "settled";
  };

  let verifyPromise: Promise<VerificationResult>;

  try {
    verifyPromise = options.runVerify();
  } catch (error) {
    verifyPromise = Promise.reject(error);
  }

  void verifyPromise.then(markSettled, notifyUnexpectedFailure);

  return {
    dispose() {
      disposed = true;
    },
    getStatus() {
      return status;
    }
  };
}
