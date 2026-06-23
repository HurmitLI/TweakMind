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
  const [executionResult] = useState<OptimizationApplyResult | null>(() => readPendingApplyResult(optimization.id));
  const showProgressAnimation = executionResult?.status === "success";
  const [progress, setProgress] = useState(showProgressAnimation ? 0 : 100);
  const applySteps = useMemo(() => applyStepKeys.map((key) => t(key)), [t]);

  useEffect(() => {
    if (!executionResult || !showProgressAnimation) {
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
  }, [applySteps.length, executionResult, showProgressAnimation]);

  const completed = progress >= 100 && executionResult !== null;
  const activeStepIndex = useMemo(
    () => Math.min(applySteps.length - 1, Math.floor((progress / 100) * applySteps.length)),
    [applySteps.length, progress]
  );
  const estimatedRemainingSeconds = Math.max(0, Math.ceil(((100 - progress) / 100) * 5));

  if (!executionResult) {
    return (
      <div className="tm-centered-shell">
        <section className="tm-centered-card">
          <h2 className="tm-typo-page">{t("apply.guard.title")}</h2>
          <p className="tm-mt-md mx-auto max-w-xl tm-typo-body">{t("apply.guard.description")}</p>
          <Link className="tm-mt-lg tm-button-primary" to={`/confirm/${optimization.id}?from=decision`}>
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
        <div className="tm-centered-shell">
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
      <div className="tm-centered-shell">
        <section className="tm-centered-card">
          <div className="tm-centered-card-icon tm-centered-card-icon-success">
            <Check size={28} aria-hidden="true" />
          </div>
          <h2 className="tm-mt-lg tm-typo-page">{t("apply.success.title")}</h2>
          <div className="tm-mt-md tm-status-badge">{getApplyModeLabelForMode(executionResult.applyMode)}</div>
          <p className="tm-mt-md mx-auto max-w-xl tm-typo-body">{message}</p>
          <div className="tm-mt-lg flex flex-col justify-center tm-gap-sm sm:flex-row">
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
                to={`/verify?id=${executionResult.optimizationId}${executionResult.historyEntryId ? `&historyId=${executionResult.historyEntryId}` : ""}`}
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
    <div className="tm-centered-shell">
      <section className="tm-card-hero tm-layout-section w-full max-w-3xl">
        <div className="flex items-start tm-gap-md">
          <div className="tm-icon-tile">
            <Loader2 className="animate-spin" size={23} aria-hidden="true" />
          </div>
          <div>
            <p className="tm-eyebrow">
              {getApplyModeLabelForMode(executionResult.applyMode)} {t("apply.progress.flowSuffix")}
            </p>
            <h2 className="tm-typo-page">{t("apply.progress.title")}</h2>
            <p className="tm-subtitle">{t("apply.progress.subtitle")}</p>
          </div>
        </div>

        <div className="tm-mt-lg tm-card-metadata">
          <div className="tm-form-grid sm:grid-cols-3">
            <div>
              <p className="tm-label">{t("apply.progress.label.currentOptimization")}</p>
              <p className="tm-value">{optimization.title}</p>
            </div>
            <div>
              <p className="tm-label">{t("apply.progress.label.applyMode")}</p>
              <p className="tm-value">{getApplyModeLabelForMode(executionResult.applyMode)}</p>
            </div>
            <div>
              <p className="tm-label">{t("apply.progress.label.currentStep")}</p>
              <p className="tm-value">{applySteps[activeStepIndex]}</p>
            </div>
            <div className="sm:col-span-3">
              <p className="tm-label">{t("apply.progress.label.estimatedRemaining")}</p>
              <p className="tm-value inline-flex items-center tm-gap-sm">
                <Clock size={15} aria-hidden="true" />
                {t("apply.progress.remainingSeconds", { seconds: estimatedRemainingSeconds })}
              </p>
            </div>
          </div>
        </div>

        <div className="tm-mt-lg">
          <div className="tm-progress-header">
            <span>{t("apply.progress.label.progress")}</span>
            <span>{progress}%</span>
          </div>
          <div className="tm-progress-track">
            <div className="tm-progress-value" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <ol className="tm-mt-lg tm-step-list">
          {applySteps.map((step, index) => {
            const isDone = index < activeStepIndex;
            const isActive = index === activeStepIndex;

            return (
              <li
                className={
                  isDone ? "tm-step-item tm-step-item-complete" : isActive ? "tm-step-item tm-step-item-active" : "tm-step-item tm-step-item-pending"
                }
                key={applyStepKeys[index]}
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
