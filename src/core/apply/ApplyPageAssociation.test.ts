import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPendingApplyResult,
  storePendingApplyResult,
  type OptimizationApplyResult
} from "../windows/WindowsOptimizationService";
import {
  getApplyConfirmationHref,
  getApplyVerificationHref,
  getInitialApplyProgress,
  readMatchedPendingApplyResult,
  resolveApplyPageView,
  shouldAnimateApplyProgress,
  startApplyProgressAnimation
} from "./ApplyPageAssociation";

function buildApplyResult(overrides: Partial<OptimizationApplyResult> = {}): OptimizationApplyResult {
  return {
    historyEntryId: "entry-1",
    optimizationId: "windows-search",
    applyMode: "real",
    status: "success",
    previousState: "Running",
    currentState: "Disabled",
    message: "Applied.",
    error: null,
    timestamp: "1700000000",
    ...overrides
  };
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ApplyPageAssociation", () => {
  it("reads only the pending slot matching the current optimization id (multi-slot isolation)", () => {
    storePendingApplyResult(
      buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-search", message: "Search" })
    );
    storePendingApplyResult(
      buildApplyResult({
        optimizationId: "sysmain",
        historyEntryId: "entry-sysmain",
        message: "SysMain",
        previousState: "Stopped"
      })
    );

    expect(readMatchedPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-search");
    expect(readMatchedPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-sysmain");
    expect(readMatchedPendingApplyResult("hags")).toBeNull();

    // Reading one id must not clear the other slot.
    expect(readMatchedPendingApplyResult("sysmain")?.message).toBe("SysMain");
  });

  it("resolves empty/wrong id to the confirmation guard without consuming other slots", () => {
    storePendingApplyResult(buildApplyResult({ optimizationId: "sysmain", historyEntryId: "entry-sysmain" }));

    const missing = resolveApplyPageView("windows-search");
    expect(missing.executionResult).toBeNull();
    expect(missing.confirmationHref).toBe("/confirm/windows-search?from=decision");
    expect(missing.verificationHref).toBeNull();
    expect(getApplyConfirmationHref("windows-search")).toBe("/confirm/windows-search?from=decision");

    expect(readMatchedPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-sysmain");
  });

  it("same-component id switch and back-forward style re-resolve only the matched slot", () => {
    storePendingApplyResult(
      buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-search", status: "success" })
    );
    storePendingApplyResult(
      buildApplyResult({
        optimizationId: "sysmain",
        historyEntryId: "entry-sysmain",
        status: "failed",
        error: "Apply failed",
        message: undefined
      })
    );

    const first = resolveApplyPageView("windows-search");
    expect(first.executionResult?.status).toBe("success");
    expect(first.showProgressAnimation).toBe(true);
    expect(first.initialProgress).toBe(0);
    expect(first.verificationHref).toBe("/verify?id=windows-search&historyId=entry-search");

    // URL id changes inside the same ApplyPage instance (or history pop to another id).
    const second = resolveApplyPageView("sysmain");
    expect(second.executionResult?.status).toBe("failed");
    expect(second.showProgressAnimation).toBe(false);
    expect(second.initialProgress).toBe(100);
    expect(second.verificationHref).toBeNull();
    expect(second.confirmationHref).toBe("/confirm/sysmain?from=decision");

    // Forward/back to the first id again.
    const back = resolveApplyPageView("windows-search");
    expect(back.executionResult?.historyEntryId).toBe("entry-search");
    expect(back.verificationHref).toBe("/verify?id=windows-search&historyId=entry-search");
    expect(readMatchedPendingApplyResult("sysmain")?.status).toBe("failed");
  });

  it("switches success-to-failed presentation when the route id target changes", () => {
    storePendingApplyResult(
      buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-ok", status: "success" })
    );
    storePendingApplyResult(
      buildApplyResult({
        optimizationId: "game-mode",
        historyEntryId: "entry-fail",
        status: "failed",
        error: "denied"
      })
    );

    expect(shouldAnimateApplyProgress(resolveApplyPageView("windows-search").executionResult)).toBe(true);
    expect(getInitialApplyProgress(resolveApplyPageView("windows-search").executionResult)).toBe(0);

    const failedView = resolveApplyPageView("game-mode");
    expect(shouldAnimateApplyProgress(failedView.executionResult)).toBe(false);
    expect(failedView.initialProgress).toBe(100);
    expect(failedView.executionResult?.optimizationId).toBe("game-mode");
  });

  it("keeps verification href aligned with the matched optimizationId and historyEntryId", () => {
    const result = buildApplyResult({
      optimizationId: "hags",
      historyEntryId: "entry-hags-42",
      status: "success"
    });

    expect(getApplyVerificationHref(result)).toBe("/verify?id=hags&historyId=entry-hags-42");
    expect(resolveApplyPageView("hags").verificationHref).toBeNull();

    storePendingApplyResult(result);
    expect(resolveApplyPageView("hags").verificationHref).toBe("/verify?id=hags&historyId=entry-hags-42");
    expect(resolveApplyPageView("sysmain").verificationHref).toBeNull();
  });

  it("disposes progress animation so a prior timer cannot overwrite a newer id attempt", async () => {
    vi.useFakeTimers();
    const onProgressFirst = vi.fn();
    const onProgressSecond = vi.fn();

    const first = startApplyProgressAnimation({
      durationMs: 1000,
      tickMs: 100,
      onProgress: onProgressFirst
    });

    await vi.advanceTimersByTimeAsync(200);
    expect(onProgressFirst).toHaveBeenCalled();
    first.dispose();

    const second = startApplyProgressAnimation({
      durationMs: 1000,
      tickMs: 100,
      onProgress: onProgressSecond
    });

    await vi.advanceTimersByTimeAsync(500);
    const firstCallsAfterDispose = onProgressFirst.mock.calls.length;

    await vi.advanceTimersByTimeAsync(500);
    expect(onProgressFirst.mock.calls.length).toBe(firstCallsAfterDispose);
    expect(onProgressSecond).toHaveBeenCalled();
    expect(onProgressSecond).toHaveBeenCalledWith(100);

    second.dispose();
  });

  it("does not clear other pending slots while resolving views", () => {
    storePendingApplyResult(buildApplyResult({ optimizationId: "windows-search", historyEntryId: "entry-a" }));
    storePendingApplyResult(buildApplyResult({ optimizationId: "sysmain", historyEntryId: "entry-b" }));

    resolveApplyPageView("windows-search");
    resolveApplyPageView("hags");

    expect(readMatchedPendingApplyResult("windows-search")?.historyEntryId).toBe("entry-a");
    expect(readMatchedPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-b");
    expect(readMatchedPendingApplyResult("hags")).toBeNull();

    clearPendingApplyResult("windows-search");
    expect(readMatchedPendingApplyResult("windows-search")).toBeNull();
    expect(readMatchedPendingApplyResult("sysmain")?.historyEntryId).toBe("entry-b");
  });
});
