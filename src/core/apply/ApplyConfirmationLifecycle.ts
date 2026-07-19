import type { OptimizationId } from "../../types/optimization";
import type { OptimizationApplyResult } from "../windows/WindowsOptimizationService";

export type ApplyConfirmationLifecycleStatus =
  | "applying"
  | "succeeded"
  | "failed"
  | "rejected-duplicate";

export interface ApplyConfirmationLifecycleOptions {
  optimizationId: OptimizationId;
  /** Starts the real apply. May return a rejecting promise or throw synchronously. */
  runApply: () => Promise<OptimizationApplyResult>;
  /**
   * Always invoked when apply resolves, using the result's own optimizationId slot.
   * Runs even after dispose so completed real work stays persisted (T11-safe).
   */
  persistResult: (result: OptimizationApplyResult) => void;
  /** Navigate / success UI — only while this attempt is still current. */
  onUiSuccess: (result: OptimizationApplyResult) => void;
  /** Failure UI — only while this attempt is still current. */
  onUiFailure: (errorMessage: string) => void;
}

export interface ApplyConfirmationLifecycleHandle {
  didStart: boolean;
  dispose: () => void;
  getStatus: () => ApplyConfirmationLifecycleStatus;
}

const inFlightOptimizationIds = new Set<string>();

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const asString = String(error ?? "").trim();
  return asString || "Apply failed unexpectedly.";
}

/** Test-only: clear in-flight gates between cases. */
export function resetApplyConfirmationLifecycleForTests(): void {
  inFlightOptimizationIds.clear();
}

export function isApplyConfirmationInFlight(optimizationId: OptimizationId): boolean {
  return inFlightOptimizationIds.has(optimizationId);
}

/**
 * One-shot apply attempt gate for ApplyConfirmationPage.
 *
 * - Blocks concurrent duplicate starts for the same optimizationId (double-click / retry races).
 * - Always persists a resolved result into its own pending slot, even after dispose.
 * - Suppresses UI updates and navigation once disposed (unmount / route id switch).
 */
export function startApplyConfirmationLifecycle(
  options: ApplyConfirmationLifecycleOptions
): ApplyConfirmationLifecycleHandle {
  if (inFlightOptimizationIds.has(options.optimizationId)) {
    return {
      didStart: false,
      dispose() {},
      getStatus() {
        return "rejected-duplicate";
      }
    };
  }

  inFlightOptimizationIds.add(options.optimizationId);

  let disposed = false;
  let status: ApplyConfirmationLifecycleStatus = "applying";

  const releaseInFlight = () => {
    inFlightOptimizationIds.delete(options.optimizationId);
  };

  const notifyUiFailure = (error: unknown) => {
    if (disposed || status !== "applying") {
      return;
    }

    status = "failed";

    try {
      options.onUiFailure(toErrorMessage(error));
    } catch {
      // Failure presentation must not escape as an unhandled rejection.
    }
  };

  const handleResolved = (result: OptimizationApplyResult) => {
    try {
      options.persistResult(result);
    } catch (error) {
      releaseInFlight();
      notifyUiFailure(error);
      return;
    }

    releaseInFlight();

    if (disposed || status !== "applying") {
      return;
    }

    status = "succeeded";

    try {
      options.onUiSuccess(result);
    } catch {
      // Navigation/presentation errors must not become unhandled rejections.
    }
  };

  const handleRejected = (error: unknown) => {
    releaseInFlight();
    notifyUiFailure(error);
  };

  let applyPromise: Promise<OptimizationApplyResult>;

  try {
    applyPromise = options.runApply();
  } catch (error) {
    applyPromise = Promise.reject(error);
  }

  void applyPromise.then(handleResolved, handleRejected);

  return {
    didStart: true,
    dispose() {
      disposed = true;
    },
    getStatus() {
      return status;
    }
  };
}
