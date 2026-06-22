import { Check, Clock, History, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorPresentation } from "../components/error/ErrorPresentation";
import { getApplyModeLabelForMode } from "../components/apply/ApplyModeBadge";
import { ErrorPresentationService } from "../core/error/ErrorPresentationService";
import { useTranslation } from "../core/localization/LanguageProvider";
import { OptimizationRepository } from "../core/optimization/OptimizationRepository";
import { readPendingApplyResult } from "../core/windows/WindowsOptimizationService";
import type { OptimizationApplyResult } from "../core/windows/WindowsOptimizationService";
import type { OptimizationId } from "../types/optimization";

const applyStepKeys = [
  "apply.step.capturingState",
  "apply.step.applying",
  "apply.step.recording",
  "apply.step.finishing"
] as const;

const stepDurationMs = 1150;

export function ApplyPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultOptimization = OptimizationRepository.getDefault();
  const requestedOptimizationId = (searchParams.get("id") as OptimizationId | null) ?? defaultOptimization.id;
  const optimization =
    OptimizationRepository.getById(requestedOptimizationId) ?? defaultOptimization;
  const [progress, setProgress] = useState(0);
  const [executionResult] = useState<OptimizationApplyResult | null>(() => readPendingApplyResult(optimization.id));
  const applySteps = useMemo(() => applyStepKeys.map((key) => t(key)), [t]);

  useEffect(() => {
    if (!executionResult) {
      return;
    }

    const startedAt = Date.now();
    const totalDuration = applySteps.length * stepDurationMs;

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        window.clearInterval(intervalId);
      }
    }, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [applySteps.length, executionResult]);

  const completed = progress >= 100 && executionResult !== null;
  const activeStepIndex = useMemo(
    () => Math.min(applySteps.length - 1, Math.floor((progress / 100) * applySteps.length)),
    [applySteps.length, progress]
  );
  const estimatedRemainingSeconds = Math.max(0, Math.ceil(((100 - progress) / 100) * 5));

  if (!executionResult) {
    return (
      <div className="tm-page-center">
        <section className="w-full max-w-3xl rounded-lg border border-amber-100 bg-white/90 p-8 text-center shadow-sm backdrop-blur dark:border-amber-500/40 dark:bg-slate-900/90">
          <h2 className="tm-title">{t("apply.guard.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">{t("apply.guard.description")}</p>
          <Link className="mt-8 tm-button-primary" to={`/confirm/${optimization.id}?from=decision`}>
            {t("apply.guard.action.openConfirmation")}
          </Link>
        </section>
      </div>
    );
  }

  if (completed) {
    const isSuccess = executionResult?.status === "success";
    const applyError = executionResult ? ErrorPresentationService.fromApplyResult(executionResult) : null;

    if (!isSuccess && applyError) {
      return (
        <div className="tm-page-center">
          <ErrorPresentation
            actions={{
              goBackHref: `/confirm/${executionResult.optimizationId}?from=decision`,
              historyHref: "/history",
              retryHref: `/confirm/${executionResult.optimizationId}?from=decision`
            }}
            descriptor={applyError}
            layout="centered"
          />
        </div>
      );
    }

    const message =
      isSuccess
        ? executionResult.applyMode === "real"
          ? t("apply.success.message.real")
          : t("apply.success.message.mock")
        : t("apply.success.message.failed");

    return (
      <div className="tm-page-center">
        <section className="w-full max-w-3xl rounded-lg border border-emerald-100 bg-white/90 p-8 text-center shadow-sm backdrop-blur dark:border-emerald-500/40 dark:bg-slate-900/90">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check size={28} aria-hidden="true" />
          </div>
          <h2 className="mt-5 tm-title">{t("apply.success.title")}</h2>
          <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {getApplyModeLabelForMode(executionResult.applyMode)}
          </div>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            {message}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
                className="tm-button-secondary"
              to="/history"
            >
              <History size={17} aria-hidden="true" />
              {t("common.action.openHistory")}
            </Link>
            {isSuccess ? (
              <Link
                className="tm-button-primary"
                to={`/verify?id=${executionResult.optimizationId}`}
              >
                <ShieldCheck size={17} aria-hidden="true" />
                {t("apply.success.action.verifyResult")}
              </Link>
            ) : null}
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
            <p className="tm-eyebrow">
              {getApplyModeLabelForMode(executionResult.applyMode)} {t("apply.progress.flowSuffix")}
            </p>
            <h2 className="tm-title">{t("apply.progress.title")}</h2>
            <p className="tm-subtitle">{t("apply.progress.subtitle")}</p>
          </div>
        </div>

        <div className="mt-8 tm-panel-muted">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("apply.progress.label.currentOptimization")}</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{optimization.title}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("apply.progress.label.applyMode")}</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{getApplyModeLabelForMode(executionResult.applyMode)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("apply.progress.label.currentStep")}</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{applySteps[activeStepIndex]}</p>
            </div>
            <div className="sm:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("apply.progress.label.estimatedRemaining")}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-950">
                <Clock size={15} aria-hidden="true" />
                {t("apply.progress.remainingSeconds", { seconds: estimatedRemainingSeconds })}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-600">
            <span>{t("apply.progress.label.progress")}</span>
            <span>{progress}%</span>
          </div>
          <div className="tm-progress-track">
            <div className="tm-progress-value" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <ol className="mt-8 grid gap-3">
          {applySteps.map((step, index) => {
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
                key={applyStepKeys[index]}
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
