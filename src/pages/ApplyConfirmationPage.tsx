import { ArrowLeft, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApplyModeBadge, getApplyModeLabel } from "../components/apply/ApplyModeBadge";
import { LoadingState } from "../components/common/LoadingState";
import { ErrorPresentation } from "../components/error/ErrorPresentation";
import { RecommendationBadge } from "../components/decision/RecommendationBadge";
import { ErrorPresentationService } from "../core/error/ErrorPresentationService";
import { getApplyConfirmationPlan } from "../core/apply/ApplyConfirmationPlan";
import { useTranslation } from "../core/localization/LanguageProvider";
import { translateOptimizationStatus, translateRecommendation, translateRiskLevel } from "../core/localization/localizationHelpers";
import { OptimizationRepository } from "../core/optimization/OptimizationRepository";
import { OptimizationExecutor } from "../core/windows/OptimizationExecutor";
import { storePendingApplyResult } from "../core/windows/WindowsOptimizationService";
import type { OptimizationId } from "../types/optimization";

const riskStyles = {
  Low: "tm-status-badge-success",
  Medium: "tm-status-badge-warning",
  High: "tm-status-badge-danger"
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="tm-card-metadata">
      <dt className="tm-label">{label}</dt>
      <dd className="tm-value">{value}</dd>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="tm-card">
      <h3 className="tm-typo-section">{title}</h3>
      <ul className="tm-mt-md tm-layout-stack tm-typo-body">
        {items.map((item) => (
          <li className="flex tm-gap-sm" key={item}>
            <CheckCircle2 className="mt-0.5 shrink-0 text-blue-700" size={17} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ApplyConfirmationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { optimizationId } = useParams();
  const [searchParams] = useSearchParams();
  const defaultOptimization = OptimizationRepository.getDefault();
  const requestedOptimizationId = (optimizationId as OptimizationId | undefined) ?? defaultOptimization.id;
  const plan = useMemo(() => getApplyConfirmationPlan(requestedOptimizationId), [requestedOptimizationId]);
  const { currentStatus, knowledge, optimization, recommendation, targetState } = plan;
  const from = searchParams.get("from");
  const cancelTarget =
    from === "knowledge-detail" || from === "knowledge"
      ? `/knowledge/detail?id=${optimization.id}&from=knowledge`
      : from === "decision"
        ? `/decision?id=${optimization.id}&from=report`
        : "/report";
  const [isConfirming, setIsConfirming] = useState(false);
  const [applyError, setApplyError] = useState<ReturnType<typeof ErrorPresentationService.fromTechnicalError> | null>(null);

  async function confirmAndApply() {
    if (!plan.canApply) {
      setApplyError(ErrorPresentationService.forApplyUnavailable(false));
      return;
    }

    setApplyError(null);
    setIsConfirming(true);

    try {
      const result = await OptimizationExecutor.apply(optimization.id);
      storePendingApplyResult(result);
      navigate(`/apply?id=${optimization.id}`);
    } catch (error) {
      setApplyError(
        ErrorPresentationService.fromTechnicalError(error instanceof Error ? error.message : String(error), "apply")
      );
    } finally {
      setIsConfirming(false);
    }
  }

  const recoveryTimeValue =
    knowledge?.recovery.estimatedTime === "Unknown" || !knowledge?.recovery.estimatedTime
      ? optimization.estimatedTime
      : knowledge.recovery.estimatedTime;
  const applyUnavailableError = plan.canApply ? null : ErrorPresentationService.forApplyUnavailable(false);
  const displayedApplyError = applyError ?? applyUnavailableError;

  return (
    <div className="tm-layout-page">
      <button
        className="tm-button-ghost"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
            return;
          }

          navigate(cancelTarget);
        }}
        type="button"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        {t("common.action.cancel")}
      </button>

      <section className="tm-card-hero">
        <div className="flex flex-col tm-gap-lg lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="tm-eyebrow">{t("applyConfirm.eyebrow")}</p>
            <h2 className="tm-typo-page">{optimization.title}</h2>
            <p className="tm-subtitle">{recommendation.reason}</p>
          </div>
          <div className="flex flex-wrap tm-gap-sm lg:justify-end">
            <RecommendationBadge value={recommendation.recommendation} />
            <ApplyModeBadge optimizationId={optimization.id} />
            <span className={["tm-status-badge", riskStyles[optimization.risk.level]].join(" ")}>
              {t("applyConfirm.riskPrefix")} {translateRiskLevel(optimization.risk.level)}
            </span>
          </div>
        </div>
      </section>

      <dl className="tm-form-grid tm-form-grid-4">
        <Field label={t("applyConfirm.label.currentDetectedStatus")} value={translateOptimizationStatus(currentStatus)} />
        <Field label={t("applyConfirm.label.targetState")} value={translateOptimizationStatus(targetState)} />
        <Field label={t("applyConfirm.label.recoveryTime")} value={recoveryTimeValue} />
        <Field label={t("applyConfirm.label.actionType")} value={getApplyModeLabel(optimization.id)} />
      </dl>

      <div className="tm-layout-grid-lg xl:grid-cols-2">
        <section className="tm-card">
          <h3 className="tm-typo-section">{t("applyConfirm.section.whatWillChange")}</h3>
          <p className="tm-mt-md tm-typo-body">{plan.whatWillChange}</p>
          <div className="tm-notice-info">
            <div className="tm-notice-row">
              <Info className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
              <p className="tm-typo-body">{plan.readinessMessage}</p>
            </div>
          </div>
          {plan.safetyNotice ? (
            <div className="tm-notice-warning">
              <div className="tm-notice-row">
                <Info className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                <p className="tm-typo-body">{plan.safetyNotice}</p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="tm-card">
          <h3 className="tm-typo-section">
            {t("applyConfirm.section.whyRecommended", { recommendation: translateRecommendation(recommendation.recommendation).toLowerCase() })}
          </h3>
          <p className="tm-mt-md tm-typo-body">{recommendation.reason}</p>
          <div className="tm-notice-info">
            <div className="tm-notice-row">
              <ShieldCheck className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
              <p className="tm-typo-body">{knowledge?.risks.riskExplanation ?? optimization.risk.reason}</p>
            </div>
          </div>
        </section>

        <ListSection
          title={t("applyConfirm.section.tradeoffs")}
          items={
            knowledge
              ? [...knowledge.tradeOffs.cons, ...knowledge.tradeOffs.possibleSideEffects]
              : optimization.tradeOffs
          }
        />

        <section className="tm-card">
          <h3 className="tm-typo-section">{t("applyConfirm.section.recoveryMethod")}</h3>
          <p className="tm-mt-md tm-typo-body">{knowledge?.recovery.recoveryMethod ?? optimization.recovery}</p>
          <dl className="tm-mt-lg tm-form-grid sm:grid-cols-2">
            <div>
              <dt className="tm-label">{t("applyConfirm.label.estimatedRecoveryTime")}</dt>
              <dd className="tm-value">{recoveryTimeValue}</dd>
            </div>
            <div>
              <dt className="tm-label">{t("applyConfirm.label.expectedResult")}</dt>
              <dd className="tm-value">
                {knowledge?.recovery.expectedResult === "Unknown" || !knowledge?.recovery.expectedResult
                  ? optimization.expectedResult
                  : knowledge.recovery.expectedResult}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {isConfirming ? (
        <LoadingState description={t("applyConfirm.loading.description")} title={t("applyConfirm.loading.title")} />
      ) : null}

      {displayedApplyError ? (
        <ErrorPresentation
          actions={{
            goBackHref: cancelTarget,
            onDismiss: applyError ? () => setApplyError(null) : undefined,
            onRetry: plan.canApply ? confirmAndApply : undefined
          }}
          descriptor={displayedApplyError}
        />
      ) : null}

      {!plan.canApply ? (
        <section className="tm-notice-warning">
          <div className="tm-notice-row">
            <Info className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
            <p className="tm-typo-body">
              <span className="tm-typo-body-emphasis">{t("unsupported.alphaNotExecutable.title")}</span>{" "}
              {t("unsupported.alphaNotExecutable.description")}
            </p>
          </div>
        </section>
      ) : null}

      <footer className="tm-footer">
        <Link
          className="tm-button-secondary"
          to={cancelTarget}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          {t("common.action.cancel")}
        </Link>
        <button
          className={plan.canApply ? "tm-button-primary" : "tm-button-disabled"}
          disabled={isConfirming || !plan.canApply}
          onClick={confirmAndApply}
          type="button"
        >
          {isConfirming ? t("applyConfirm.action.preparingApply") : t("applyConfirm.action.confirmAndContinue")}
        </button>
      </footer>
    </div>
  );
}
