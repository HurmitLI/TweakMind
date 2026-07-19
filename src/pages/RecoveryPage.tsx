import { Check, Clock, History, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorPresentation } from "../components/error/ErrorPresentation";
import { ErrorPresentationService } from "../core/error/ErrorPresentationService";
import { useTranslation } from "../core/localization/LanguageProvider";
import { translateOptimizationStatus } from "../core/localization/localizationHelpers";
import { translateRuntimeMessage } from "../core/localization/RuntimeMessageLocalizationService";
import {
  getRecoveryConfirmationHref,
  hasInFlightRecoveryLifecycle,
  subscribeRecoveryPageLifecycle
} from "../core/recovery/RecoveryPageLifecycle";
import { OptimizationExecutor } from "../core/windows/OptimizationExecutor";
import {
  clearPendingRecoveryResult,
  consumePendingRecoveryAuthorization,
  hasPendingRecoveryAuthorization,
  storePendingRecoveryResult,
  type OptimizationRecoveryResult,
  WindowsOptimizationService
} from "../core/windows/WindowsOptimizationService";

const recoveryStepKeys = [
  "recovery.step.readingSavedState",
  "recovery.step.applyingRecovery",
  "recovery.step.verifyingRecovery",
  "recovery.step.recordingRecovery",
  "recovery.step.completed"
] as const;

const stepDurationMs = 1000;
const recoveryTickMs = 120;
const recoveryDurationMs = recoveryStepKeys.length * stepDurationMs;

export function RecoveryPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const historyEntryId = searchParams.get("historyId") ?? "";
  const entry = historyEntryId ? WindowsOptimizationService.getHistoryEntry(historyEntryId) : undefined;
  const [isAuthorized] = useState(() =>
    historyEntryId
      ? hasPendingRecoveryAuthorization(historyEntryId) || hasInFlightRecoveryLifecycle(historyEntryId)
      : false
  );
  const [result, setResult] = useState<OptimizationRecoveryResult | null>(null);
  const [unexpectedFailure, setUnexpectedFailure] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const recoverySteps = useMemo(() => recoveryStepKeys.map((key) => t(key)), [t]);

  useEffect(() => {
    if (!entry || !isAuthorized) {
      return;
    }

    const subscription = subscribeRecoveryPageLifecycle({
      historyEntryId: entry.id,
      runRestore: () => OptimizationExecutor.restore(entry),
      recoveryDurationMs,
      recoveryTickMs,
      onStartFresh() {
        // Called only after the in-flight restore session exists. Session auth
        // consume is precise; legacy local + matched pending clears are best-effort
        // and must never block the already-started runRestore.
        consumePendingRecoveryAuthorization(entry.id);

        try {
          clearPendingRecoveryResult(entry.id);
        } catch {
          // Pending map rewrite failures must not abort recovery.
        }
      },
      onProgress: setProgress,
      onSucceeded(recoveryResult) {
        // Only successful recoveries become pending verification input.
        storePendingRecoveryResult(recoveryResult);
        setResult(recoveryResult);
      },
      onFailed(failure) {
        if (failure.kind === "result") {
          setResult(failure.result);
          return;
        }

        setUnexpectedFailure(failure.errorMessage);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [entry, isAuthorized]);

  const activeStepIndex = useMemo(
    () => Math.min(recoverySteps.length - 1, Math.floor((progress / 100) * recoverySteps.length)),
    [progress, recoverySteps.length]
  );
  const estimatedRemainingSeconds = Math.max(0, Math.ceil(((100 - progress) / 100) * 5));
  const recoveryRetryHref = getRecoveryConfirmationHref(entry?.id ?? "");
  const failedRecoveryError =
    result && result.status !== "success" ? ErrorPresentationService.fromRecoveryResult(result) : null;
  const successReady = result?.status === "success" && progress >= 100;

  if (!entry || !isAuthorized) {
    return (
      <div className="tm-centered-shell">
        <ErrorPresentation
          actions={{
            goBackHref: "/history",
            historyHref: "/history"
          }}
          descriptor={ErrorPresentationService.forRecoveryUnavailable()}
          layout="centered"
        />
      </div>
    );
  }

  if (unexpectedFailure !== null) {
    return (
      <div className="tm-centered-shell">
        <ErrorPresentation
          actions={{
            goBackHref: "/history",
            historyHref: "/history",
            retryHref: recoveryRetryHref
          }}
          descriptor={ErrorPresentationService.fromTechnicalError(unexpectedFailure, "recovery", {
            type: "recovery-failed"
          })}
          layout="centered"
        />
      </div>
    );
  }

  if (failedRecoveryError) {
    return (
      <div className="tm-centered-shell">
        <ErrorPresentation
          actions={{
            goBackHref: "/history",
            historyHref: "/history",
            retryHref: recoveryRetryHref
          }}
          descriptor={failedRecoveryError}
          layout="centered"
        />
      </div>
    );
  }

  if (successReady && result) {
    return (
      <div className="tm-centered-shell">
        <section className="tm-centered-card">
          <div className="tm-centered-card-icon tm-centered-card-icon-success">
            <Check size={28} aria-hidden="true" />
          </div>
          <h2 className="tm-mt-lg tm-typo-page">{t("recovery.success.title")}</h2>
          <p className="tm-mt-md mx-auto max-w-xl tm-typo-body">
            {result.message ? translateRuntimeMessage(result.message) : t("recovery.success.defaultMessage")}
          </p>
          <div className="tm-mt-lg flex flex-col justify-center tm-gap-sm sm:flex-row">
            <Link className="tm-button-secondary" to="/history">
              <History size={17} aria-hidden="true" />
              {t("common.action.openHistory")}
            </Link>
            <Link
              className="tm-button-primary"
              to={`/verify?id=${entry.optimizationId}&mode=recovery&historyId=${entry.id}`}
            >
              <ShieldCheck size={17} aria-hidden="true" />
              {t("recovery.success.action.verifyRecovery")}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="tm-centered-shell">
      <section className="tm-card-hero tm-layout-section w-full max-w-3xl">
        <div className="flex items-start tm-gap-md">
          <div className="tm-icon-tile">
            <Loader2 className="animate-spin" size={23} aria-hidden="true" />
          </div>
          <div>
            <p className="tm-eyebrow">{t("recovery.progress.eyebrow")}</p>
            <h2 className="tm-typo-page">{t("recovery.progress.title")}</h2>
            <p className="tm-subtitle">{t("recovery.progress.subtitle")}</p>
          </div>
        </div>

        <div className="tm-mt-lg tm-card-metadata">
          <div className="tm-form-grid sm:grid-cols-3">
            <div>
              <p className="tm-label">{t("recovery.progress.label.currentOptimization")}</p>
              <p className="tm-value">{entry.optimizationName}</p>
            </div>
            <div>
              <p className="tm-label">{t("recovery.progress.label.expectedRestoredState")}</p>
              <p className="tm-value">{translateOptimizationStatus(entry.previousState)}</p>
            </div>
            <div>
              <p className="tm-label">{t("recovery.progress.label.currentStep")}</p>
              <p className="tm-value">{recoverySteps[activeStepIndex]}</p>
            </div>
            <div className="sm:col-span-3">
              <p className="tm-label">{t("recovery.progress.label.estimatedRemaining")}</p>
              <p className="tm-value inline-flex items-center tm-gap-sm">
                <Clock size={15} aria-hidden="true" />
                {t("recovery.progress.remainingSeconds", { seconds: estimatedRemainingSeconds })}
              </p>
            </div>
          </div>
        </div>

        <div className="tm-mt-lg">
          <div className="tm-progress-header">
            <span>{t("recovery.progress.label.progress")}</span>
            <span>{progress}%</span>
          </div>
          <div className="tm-progress-track">
            <div className="tm-progress-value" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <ol className="tm-mt-lg tm-step-list">
          {recoverySteps.map((step, index) => {
            const isDone = index < activeStepIndex;
            const isActive = index === activeStepIndex;

            return (
              <li
                className={
                  isDone ? "tm-step-item tm-step-item-complete" : isActive ? "tm-step-item tm-step-item-active" : "tm-step-item tm-step-item-pending"
                }
                key={recoveryStepKeys[index]}
              >
                <span
                  className={
                    isDone ? "tm-step-marker tm-step-marker-complete" : isActive ? "tm-step-marker tm-step-marker-active" : "tm-step-marker"
                  }
                >
                  {isDone ? <Check size={16} aria-hidden="true" /> : isActive ? <Loader2 className="animate-spin" size={15} aria-hidden="true" /> : null}
                </span>
                <span className="tm-typo-body-emphasis">{step}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
