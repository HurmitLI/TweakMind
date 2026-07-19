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
 */
export function startVerificationPageLifecycle(
  options: VerificationPageLifecycleOptions
): VerificationPageLifecycleHandle {
  let disposed = false;
  let status: VerificationPageLifecycleStatus = "verifying";

  const markSettled = (result: VerificationResult) => {
    if (disposed || status !== "verifying") {
      return;
    }

    status = "settled";
    options.onSettled(result);
  };

  const markUnexpectedFailure = (error: unknown) => {
    if (disposed || status !== "verifying") {
      return;
    }

    status = "failed";
    options.onUnexpectedFailure(toErrorMessage(error));
  };

  let verifyPromise: Promise<VerificationResult>;

  try {
    verifyPromise = options.runVerify();
  } catch (error) {
    verifyPromise = Promise.reject(error);
  }

  void verifyPromise.then(markSettled, markUnexpectedFailure);

  return {
    dispose() {
      disposed = true;
    },
    getStatus() {
      return status;
    }
  };
}
