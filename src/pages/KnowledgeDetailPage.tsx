import { ArrowLeft, Check, X } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorPresentation } from "../components/error/ErrorPresentation";
import { ApplyModeBadge } from "../components/apply/ApplyModeBadge";
import { BulletListSection } from "../components/decision/BulletListSection";
import { DecisionSection } from "../components/decision/DecisionSection";
import { OptimizationWorkflowStrip } from "../components/decision/OptimizationWorkflowStrip";
import { RecommendationBadge } from "../components/decision/RecommendationBadge";
import { ErrorPresentationService } from "../core/error/ErrorPresentationService";
import { OptimizationCapabilityRegistry } from "../core/execution/OptimizationCapabilityRegistry";
import { KnowledgeRepository } from "../core/knowledge/KnowledgeRepository";
import { useTranslation } from "../core/localization/LanguageProvider";
import {
  translateBenefitLevel,
  translateConfidence,
  translateConfidenceLevel,
  translateRecommendation,
  translateRiskLevel,
  translateScanCapability,
  translateScanDisplayState
} from "../core/localization/localizationHelpers";
import { OptimizationRepository } from "../core/optimization/OptimizationRepository";
import { RuntimeScanService } from "../core/scan/RuntimeScanService";
import { readStoredScanResult, toRecommendationResult } from "../core/scan/ScanResult";
import { useSettings } from "../core/settings/SettingsProvider";
import { SettingsService } from "../core/settings/SettingsService";
import { WindowsOptimizationService } from "../core/windows/WindowsOptimizationService";
import type { OptimizationId } from "../types/optimization";

const riskStyles = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-rose-200 bg-rose-50 text-rose-700",
  Unknown: "border-slate-200 bg-slate-50 text-slate-700"
};

function ChecklistSection({ title, items, variant }: { title: string; items: string[]; variant: "positive" | "negative" }) {
  const isPositive = variant === "positive";
  const Icon = isPositive ? Check : X;

  return (
    <DecisionSection title={title}>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li className="flex items-start gap-3" key={item}>
            <span
              className={[
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                isPositive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              ].join(" ")}
            >
              <Icon size={14} aria-hidden="true" />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </DecisionSection>
  );
}

function resolveCurrentScanState(optimizationId: OptimizationId) {
  return RuntimeScanService.getDisplayState(optimizationId);
}

function translateRuntimeScanStatus(value: string, t: ReturnType<typeof useTranslation>["t"]) {
  if (value === "Detected") {
    return t("scan.runtimeStatus.detected");
  }

  if (value === "Unknown") {
    return t("scan.runtimeStatus.unknown");
  }

  return translateScanDisplayState(value);
}

export function KnowledgeDetailPage() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [searchParams] = useSearchParams();
  const scanResult = useMemo(() => readStoredScanResult(), []);
  const defaultOptimization = OptimizationRepository.getDefault();
  const requestedOptimizationId = (searchParams.get("id") as OptimizationId | null) ?? defaultOptimization.id;
  const from = searchParams.get("from") === "knowledge" ? "knowledge" : "report";
  const knowledge = KnowledgeRepository.getById(requestedOptimizationId);
  const optimizationResult = scanResult?.optimizationResults.find((result) => result.id === requestedOptimizationId);
  const recommendation = optimizationResult
    ? toRecommendationResult(optimizationResult)
    : {
        id: requestedOptimizationId,
        recommendation: knowledge
          ? "Optional"
          : OptimizationRepository.getById(requestedOptimizationId)?.recommendation ?? "Optional",
        reason: knowledge?.overview.purpose ?? t("knowledgeDetail.fallback.scanReason"),
        currentStatus: "Unknown" as const,
        selectable: false,
        selectedByDefault: false
      };
  const currentScanState = resolveCurrentScanState(requestedOptimizationId);
  const runtimeScan = RuntimeScanService.getStoredSnapshot(requestedOptimizationId);
  const scanCapability = RuntimeScanService.getCapability(requestedOptimizationId);
  const canRealApply = OptimizationCapabilityRegistry.canRealApply(requestedOptimizationId);
  const historyEntries = useMemo(
    () => WindowsOptimizationService.getHistory().filter((entry) => entry.optimizationId === requestedOptimizationId),
    [requestedOptimizationId]
  );
  const backTarget = from === "knowledge" ? "/knowledge" : "/report";
  const backLabel = from === "knowledge" ? t("knowledgeDetail.back.knowledge") : t("knowledgeDetail.back.report");
  const applyFrom = from === "knowledge" ? "knowledge-detail" : "decision";

  if (!knowledge) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          to={backTarget}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          {backLabel}
        </Link>
        <section className="rounded-lg border border-slate-200 bg-white/95 p-6 shadow-sm">
          <ErrorPresentation
            actions={{ goBackHref: backTarget }}
            descriptor={ErrorPresentationService.fromTechnicalError(
              t("knowledgeDetail.error.notAvailable.explanation"),
              "knowledge",
              {
                title: t("knowledgeDetail.error.notAvailable.title"),
                explanation: t("knowledgeDetail.error.notAvailable.explanation"),
                recommendedAction: t("knowledgeDetail.error.notAvailable.action")
              }
            )}
          />
        </section>
      </div>
    );
  }

  const displayRiskLevel = knowledge.risks.riskLevel;
  const tradeOffItems = [...new Set([...knowledge.tradeOffs.cons, ...knowledge.tradeOffs.possibleSideEffects])];
  const recoveryTime =
    knowledge.recovery.estimatedTime === "Unknown" ? "Unknown" : knowledge.recovery.estimatedTime;
  const displayTitle = SettingsService.resolveKnowledgeTitle(knowledge, settings.terminologyMode);
  const applyUnavailableError = ErrorPresentationService.forApplyUnavailable(canRealApply);
  const runtimeScanError = ErrorPresentationService.forRuntimeScanUnavailable(
    runtimeScan?.unavailableReason ?? scanCapability.unavailableReason
  );
  const runtimeScanStatus =
    runtimeScan?.runtimeScanStatus ??
    (scanCapability.scanCapability === "Not Supported Yet" ? "Not Supported Yet" : "Scan Required");

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Link
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        to={backTarget}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        {backLabel}
      </Link>

      <OptimizationWorkflowStrip currentStep="Decision" />

      <section className="rounded-lg border border-white/70 bg-white/85 px-8 py-8 shadow-sm backdrop-blur">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">{t("knowledgeDetail.eyebrow")}</p>
        <h2 className="text-4xl font-semibold tracking-tight text-slate-950">{t("knowledgeDetail.title", { title: displayTitle })}</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <RecommendationBadge value={recommendation.recommendation} />
          <span
            className={[
              "rounded-full border px-3 py-1 text-sm font-semibold",
              riskStyles[displayRiskLevel === "Unknown" ? "Unknown" : displayRiskLevel]
            ].join(" ")}
          >
            {t("knowledgeDetail.badge.riskPrefix")} {translateRiskLevel(displayRiskLevel)}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {t("knowledgeDetail.badge.currentStatePrefix")} {translateScanDisplayState(currentScanState)}
          </span>
          <ApplyModeBadge optimizationId={knowledge.identity.id} />
        </div>
      </section>

      {currentScanState === "Scan Required" ? (
        <ErrorPresentation
          actions={{
            goBackHref: backTarget,
            retryHref: "/scan"
          }}
          descriptor={ErrorPresentationService.forScanRequired()}
        />
      ) : null}

      {applyUnavailableError ? (
        <ErrorPresentation actions={{ goBackHref: backTarget }} descriptor={applyUnavailableError} />
      ) : null}

      <DecisionSection title={t("knowledgeDetail.section.summary")}>
        <p className="text-base leading-7 text-slate-700">{knowledge.overview.summary}</p>
      </DecisionSection>

      <dl className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("knowledgeDetail.label.expectedBenefit")}</dt>
          <dd className="mt-2 text-sm font-semibold text-slate-950">{translateBenefitLevel(knowledge.decisionSupport.expectedBenefit)}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("knowledgeDetail.label.confidence")}</dt>
          <dd className="mt-2 text-sm font-semibold text-slate-950">{translateConfidenceLevel(knowledge.decisionSupport.confidence)}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("knowledgeDetail.label.recommendation")}</dt>
          <dd className="mt-2 text-sm font-semibold text-slate-950">{translateRecommendation(recommendation.recommendation)}</dd>
        </div>
      </dl>

      <div className="grid gap-6 xl:grid-cols-2">
        <BulletListSection title={t("knowledgeDetail.section.tradeoffs")} items={tradeOffItems} />
        <DecisionSection title={t("knowledgeDetail.section.risks")}>
          <p>{knowledge.risks.riskExplanation}</p>
          {knowledge.risks.whenNotToUse.length > 0 ? (
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-700">
              {knowledge.risks.whenNotToUse.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : null}
        </DecisionSection>
        <ChecklistSection title={t("knowledgeDetail.section.recommendedFor")} items={knowledge.recommendation.recommendedFor} variant="positive" />
        <ChecklistSection title={t("knowledgeDetail.section.notRecommendedFor")} items={knowledge.recommendation.notRecommendedFor} variant="negative" />
      </div>

      <DecisionSection title={t("knowledgeDetail.section.recovery")}>
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("knowledgeDetail.label.recoveryMethod")}</dt>
            <dd className="mt-2 text-sm leading-6 text-slate-700">{knowledge.recovery.recoveryMethod}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("knowledgeDetail.label.recoveryDifficulty")}</dt>
            <dd className="mt-2 text-sm leading-6 text-slate-700">{knowledge.recovery.recoveryDifficulty}</dd>
          </div>
          {recoveryTime !== "Unknown" ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("knowledgeDetail.label.estimatedRecoveryTime")}</dt>
              <dd className="mt-2 text-sm leading-6 text-slate-700">{recoveryTime}</dd>
            </div>
          ) : null}
        </dl>
      </DecisionSection>

      <DecisionSection title={t("knowledgeDetail.section.runtimeScan")}>
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("knowledgeDetail.label.scanCapability")}</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-950">{translateScanCapability(scanCapability.scanCapability)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("knowledgeDetail.label.detectionMethod")}</dt>
            <dd className="mt-2 text-sm leading-6 text-slate-700">{scanCapability.detectionMethod}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("knowledgeDetail.label.runtimeScanStatus")}</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-950">{translateRuntimeScanStatus(runtimeScanStatus, t)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("knowledgeDetail.label.currentRuntimeState")}</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-950">{translateScanDisplayState(currentScanState)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("knowledgeDetail.label.detectionConfidence")}</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-950">
              {translateConfidence(runtimeScan?.detectionConfidence ?? "None")}
            </dd>
          </div>
          {runtimeScanError ? (
            <div className="md:col-span-2">
              <ErrorPresentation actions={{ retryHref: "/scan" }} descriptor={runtimeScanError} />
            </div>
          ) : null}
        </dl>
      </DecisionSection>

      <DecisionSection title={t("knowledgeDetail.section.decisionNotes")}>
        <p className="text-base leading-7 text-slate-700">{knowledge.decisionSupport.decisionNotes}</p>
      </DecisionSection>

      {knowledge.learning.relatedOptimizations.length > 0 ? (
        <DecisionSection title={t("knowledgeDetail.section.relatedOptimizations")}>
          <div className="flex flex-wrap gap-2">
            {knowledge.learning.relatedOptimizations.map((relatedId) => {
              const related = KnowledgeRepository.getById(relatedId);
              if (!related) {
                return null;
              }

              return (
                <Link
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                  key={relatedId}
                  to={`/knowledge/detail?id=${relatedId}&from=${from}`}
                >
                  {SettingsService.resolveKnowledgeTitle(related)}
                </Link>
              );
            })}
          </div>
        </DecisionSection>
      ) : null}

      <footer className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          to={backTarget}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          {backLabel}
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row">
          {historyEntries.length > 0 ? (
            <Link
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              to="/history"
            >
              {t("knowledgeDetail.action.viewHistory")}
            </Link>
          ) : null}

          {canRealApply ? (
            <Link
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              to={`/confirm/${knowledge.identity.id}?from=${applyFrom}`}
            >
              {t("knowledgeDetail.action.apply")}
            </Link>
          ) : (
            <button
              className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-lg bg-slate-200 px-5 text-sm font-semibold text-slate-600"
              disabled
              type="button"
            >
              {t("knowledgeDetail.action.applyNotAvailable")}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
