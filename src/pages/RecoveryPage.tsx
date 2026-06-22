import { Check, Clock, History, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorPresentation } from "../components/error/ErrorPresentation";
import { ErrorPresentationService } from "../core/error/ErrorPresentationService";
import { useTranslation } from "../core/localization/LanguageProvider";
import { translateOptimizationStatus } from "../core/localization/localizationHelpers";
import { translateRuntimeMessage } from "../core/localization/RuntimeMessageLocalizationService";
import { OptimizationExecutor } from "../core/windows/OptimizationExecutor";
import {
  readPendingRecoveryResult,
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

export function RecoveryPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const historyEntryId = searchParams.get("historyId") ?? "";
  const entry = historyEntryId ? WindowsOptimizationService.getHistoryEntry(historyEntryId) : undefined;
  const [result, setResult] = useState<OptimizationRecoveryResult | null>(() =>
    historyEntryId ? readPendingRecoveryResult(historyEntryId) : null
  );
  const [progress, setProgress] = useState(0);
  const hasStarted = useRef(false);
  const recoverySteps = useMemo(() => recoveryStepKeys.map((key) => t(key)), [t]);

  useEffect(() => {
    if (!entry || result || hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    void OptimizationExecutor.restore(entry).then((recoveryResult) => {
      storePendingRecoveryResult(recoveryResult);
      setResult(recoveryResult);
    });
  }, [entry, result]);

  useEffect(() => {
    if (!entry) {
      return;
    }

    const startedAt = Date.now();
    const totalDuration = recoverySteps.length * stepDurationMs;

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProgress(result ? 100 : nextProgress);

      if (result || nextProgress >= 100) {
        window.clearInterval(intervalId);
      }
    }, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [entry, recoverySteps.length, result]);

  const completed = progress >= 100 && result !== null;
  const activeStepIndex = useMemo(
    () => Math.min(recoverySteps.length - 1, Math.floor((progress / 100) * recoverySteps.length)),
    [progress, recoverySteps.length]
  );
  const estimatedRemainingSeconds = Math.max(0, Math.ceil(((100 - progress) / 100) * 5));

  if (!entry) {
    return (
      <div className="tm-page-center">
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

  if (completed) {
    const isSuccess = result.status === "success";
    const recoveryError = ErrorPresentationService.fromRecoveryResult(result);

    if (!isSuccess && recoveryError) {
      return (
        <div className="tm-page-center">
          <ErrorPresentation
            actions={{
              goBackHref: "/history",
              historyHref: "/history",
              retryHref: `/recovery?historyId=${entry.id}`
            }}
            descriptor={recoveryError}
            layout="centered"
          />
        </div>
      );
    }

    return (
      <div className="tm-page-center">
        <section className="w-full max-w-3xl rounded-lg border border-emerald-100 bg-white/90 p-8 text-center shadow-sm backdrop-blur dark:border-emerald-500/40 dark:bg-slate-900/90">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check size={28} aria-hidden="true" />
          </div>
          <h2 className="mt-5 tm-title">{t("recovery.success.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            {result.message ? translateRuntimeMessage(result.message) : t("recovery.success.defaultMessage")}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
    <div className="tm-page-center">
      <section className="w-full max-w-3xl tm-hero">
        <div className="flex items-start gap-4">
          <div className="tm-icon-tile">
            <Loader2 className="animate-spin" size={23} aria-hidden="true" />
          </div>
          <div>
            <p className="tm-eyebrow">{t("recovery.progress.eyebrow")}</p>
            <h2 className="tm-title">{t("recovery.progress.title")}</h2>
            <p className="tm-subtitle">{t("recovery.progress.subtitle")}</p>
          </div>
        </div>

        <div className="mt-8 tm-panel-muted">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("recovery.progress.label.currentOptimization")}</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{entry.optimizationName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("recovery.progress.label.expectedRestoredState")}</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{translateOptimizationStatus(entry.previousState)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("recovery.progress.label.currentStep")}</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{recoverySteps[activeStepIndex]}</p>
            </div>
            <div className="sm:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("recovery.progress.label.estimatedRemaining")}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-950">
                <Clock size={15} aria-hidden="true" />
                {t("recovery.progress.remainingSeconds", { seconds: estimatedRemainingSeconds })}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-600">
            <span>{t("recovery.progress.label.progress")}</span>
            <span>{progress}%</span>
          </div>
          <div className="tm-progress-track">
            <div className="tm-progress-value" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <ol className="mt-8 grid gap-3">
          {recoverySteps.map((step, index) => {
            const isDone = index < activeStepIndex;
            const isActive = index === activeStepIndex;

            return (
              <li
                className={[
                  "flex items-center gap-3 rounded-lg border px-4 py-3 transition",
                  isDone
                    ? "border-emerald-100 bg-white text-slate-950"
                    : isActive
                      ? "border-blue-200 bg-blue-50 text-slate-950"
                      : "border-slate-200 bg-white/60 text-slate-400"
                ].join(" ")}
                key={recoveryStepKeys[index]}
              >
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                    isDone
                      ? "border-emerald-200 bg-emerald-500 text-white"
                      : isActive
                        ? "border-blue-200 bg-blue-600 text-white"
                        : "border-slate-200 bg-slate-100 text-transparent"
                  ].join(" ")}
                >
                  {isDone ? <Check size={16} aria-hidden="true" /> : isActive ? <Loader2 className="animate-spin" size={15} aria-hidden="true" /> : null}
                </span>
                <span className="text-sm font-medium">{step}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
