import type { OptimizationId } from "../../types/optimization";
import {
  readPendingApplyResult,
  type OptimizationApplyResult
} from "../windows/WindowsOptimizationService";

/**
 * Read only the pending apply slot that matches the current route optimization id.
 * Never clears or consumes other keyed slots (T11 isolation).
 */
export function readMatchedPendingApplyResult(
  optimizationId: OptimizationId
): OptimizationApplyResult | null {
  const result = readPendingApplyResult(optimizationId);

  if (!result || result.optimizationId !== optimizationId) {
    return null;
  }

  return result;
}

/** Failed / missing results must not play the success progress animation. */
export function shouldAnimateApplyProgress(result: OptimizationApplyResult | null): boolean {
  return result?.status === "success";
}

export function getInitialApplyProgress(result: OptimizationApplyResult | null): number {
  return shouldAnimateApplyProgress(result) ? 0 : 100;
}

export function getApplyConfirmationHref(optimizationId: OptimizationId): string {
  return `/confirm/${optimizationId}?from=decision`;
}

/** Success verify link must carry the matched optimizationId and historyEntryId. */
export function getApplyVerificationHref(result: OptimizationApplyResult): string {
  const historyQuery = result.historyEntryId ? `&historyId=${result.historyEntryId}` : "";
  return `/verify?id=${result.optimizationId}${historyQuery}`;
}

export interface ApplyPageViewModel {
  optimizationId: OptimizationId;
  executionResult: OptimizationApplyResult | null;
  showProgressAnimation: boolean;
  initialProgress: number;
  confirmationHref: string;
  verificationHref: string | null;
}

/**
 * Pure view resolution for ApplyPage: always keyed by the current optimization id.
 * Simulates same-component search-param / back-forward switches without React.
 */
export function resolveApplyPageView(optimizationId: OptimizationId): ApplyPageViewModel {
  const executionResult = readMatchedPendingApplyResult(optimizationId);
  const showProgressAnimation = shouldAnimateApplyProgress(executionResult);

  return {
    optimizationId,
    executionResult,
    showProgressAnimation,
    initialProgress: getInitialApplyProgress(executionResult),
    confirmationHref: getApplyConfirmationHref(optimizationId),
    verificationHref:
      executionResult?.status === "success" ? getApplyVerificationHref(executionResult) : null
  };
}

export interface ApplyProgressAnimationOptions {
  durationMs: number;
  tickMs: number;
  now?: () => number;
  setIntervalFn?: (handler: () => void, timeout: number) => ReturnType<typeof setInterval>;
  clearIntervalFn?: (id: ReturnType<typeof setInterval>) => void;
  onProgress: (progress: number) => void;
}

export interface ApplyProgressAnimationHandle {
  dispose: () => void;
}

/** Progress ticker that stops cleanly on dispose so id switches cannot overwrite new state. */
export function startApplyProgressAnimation(options: ApplyProgressAnimationOptions): ApplyProgressAnimationHandle {
  const now = options.now ?? Date.now;
  const setIntervalFn = options.setIntervalFn ?? setInterval;
  const clearIntervalFn = options.clearIntervalFn ?? clearInterval;
  const startedAt = now();
  let disposed = false;
  let intervalId: ReturnType<typeof setInterval> | undefined;

  intervalId = setIntervalFn(() => {
    if (disposed) {
      return;
    }

    const elapsed = now() - startedAt;
    const nextProgress = Math.min(100, Math.round((elapsed / options.durationMs) * 100));
    options.onProgress(nextProgress);

    if (nextProgress >= 100 && intervalId !== undefined) {
      clearIntervalFn(intervalId);
      intervalId = undefined;
    }
  }, options.tickMs);

  return {
    dispose() {
      disposed = true;

      if (intervalId !== undefined) {
        clearIntervalFn(intervalId);
        intervalId = undefined;
      }
    }
  };
}
