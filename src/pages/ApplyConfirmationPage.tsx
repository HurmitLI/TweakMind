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
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-rose-200 bg-rose-50 text-rose-700"
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li className="flex gap-3" key={item}>
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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <button
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
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

      <section className="rounded-lg border border-white/70 bg-white/85 px-8 py-8 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">{t("applyConfirm.eyebrow")}</p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">{optimization.title}</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{recommendation.reason}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <RecommendationBadge value={recommendation.recommendation} />
            <ApplyModeBadge optimizationId={optimization.id} />
            <span className={["inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold", riskStyles[optimization.risk.level]].join(" ")}>
              {t("applyConfirm.riskPrefix")} {translateRiskLevel(optimization.risk.level)}
            </span>
          </div>
        </div>
      </section>

      <dl className="grid gap-4 md:grid-cols-4">
        <Field label={t("applyConfirm.label.currentDetectedStatus")} value={translateOptimizationStatus(currentStatus)} />
        <Field label={t("applyConfirm.label.targetState")} value={translateOptimizationStatus(targetState)} />
        <Field label={t("applyConfirm.label.recoveryTime")} value={recoveryTimeValue} />
        <Field label={t("applyConfirm.label.actionType")} value={getApplyModeLabel(optimization.id)} />
      </dl>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">{t("applyConfirm.section.whatWillChange")}</h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">{plan.whatWillChange}</p>
          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
              <p>{plan.readinessMessage}</p>
            </div>
          </div>
          {plan.safetyNotice ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                <p>{plan.safetyNotice}</p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">
            {t("applyConfirm.section.whyRecommended", { recommendation: translateRecommendation(recommendation.recommendation).toLowerCase() })}
          </h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">{recommendation.reason}</p>
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <ShieldCheck className="mt-0.5 shrink-0 text-slate-700" size={18} aria-hidden="true" />
            <p>{knowledge?.risks.riskExplanation ?? optimization.risk.reason}</p>
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

        <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">{t("applyConfirm.section.recoveryMethod")}</h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">{knowledge?.recovery.recoveryMethod ?? optimization.recovery}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">{t("applyConfirm.label.estimatedRecoveryTime")}</dt>
              <dd className="mt-1 text-slate-950">{recoveryTimeValue}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">{t("applyConfirm.label.expectedResult")}</dt>
              <dd className="mt-1 text-slate-950">
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

      {applyError ? (
        <ErrorPresentation
          actions={{
            goBackHref: cancelTarget,
            onDismiss: () => setApplyError(null),
            onRetry: confirmAndApply
          }}
          descriptor={applyError}
        />
      ) : null}

      <footer className="flex flex-col-reverse gap-3 rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          to={cancelTarget}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          {t("common.action.cancel")}
        </Link>
        <button
          className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isConfirming}
          onClick={confirmAndApply}
          type="button"
        >
          {isConfirming ? t("applyConfirm.action.preparingApply") : t("applyConfirm.action.confirmAndContinue")}
        </button>
      </footer>
    </div>
  );
}
