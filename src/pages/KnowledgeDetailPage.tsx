import { ArrowLeft, Check, X } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorPresentation } from "../components/error/ErrorPresentation";
import { ApplyModeBadge } from "../components/apply/ApplyModeBadge";
import { BulletListSection } from "../components/decision/BulletListSection";
import { DecisionSection } from "../components/decision/DecisionSection";
import { OptimizationWorkflowStrip } from "../components/decision/OptimizationWorkflowStrip";
import { RecommendationBadge } from "../components/decision/RecommendationBadge";
import { getApplyConfirmationPlan } from "../core/apply/ApplyConfirmationPlan";
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

const riskBadgeStyles = {
  Low: "tm-status-badge tm-status-badge-success",
  Medium: "tm-status-badge tm-status-badge-warning",
  High: "tm-status-badge tm-status-badge-danger",
  Unknown: "tm-status-badge"
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
  const applyPlan = getApplyConfirmationPlan(requestedOptimizationId);
  const historyEntries = useMemo(
    () => WindowsOptimizationService.getHistory().filter((entry) => entry.optimizationId === requestedOptimizationId),
    [requestedOptimizationId]
  );
  const backTarget = from === "knowledge" ? "/knowledge" : "/report";
  const backLabel = from === "knowledge" ? t("knowledgeDetail.back.knowledge") : t("knowledgeDetail.back.report");
  const applyFrom = from === "knowledge" ? "knowledge-detail" : "decision";

  if (!knowledge) {
    return (
      <div className="tm-layout-page">
        <Link
          className="tm-button-ghost"
          to={backTarget}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          {backLabel}
        </Link>
        <section className="tm-card">
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
    <div className="tm-layout-page">
      <Link
        className="tm-button-ghost"
        to={backTarget}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        {backLabel}
      </Link>

      <OptimizationWorkflowStrip currentStep="Decision" />

      <section className="tm-card-hero">
        <p className="tm-eyebrow">{t("knowledgeDetail.eyebrow")}</p>
        <h2 className="tm-typo-page">{t("knowledgeDetail.title", { title: displayTitle })}</h2>
        <div className="tm-mt-md flex flex-wrap tm-gap-sm">
          <RecommendationBadge value={recommendation.recommendation} />
          <span className={riskBadgeStyles[displayRiskLevel === "Unknown" ? "Unknown" : displayRiskLevel]}>
            {t("knowledgeDetail.badge.riskPrefix")} {translateRiskLevel(displayRiskLevel)}
          </span>
          <span className="tm-status-badge">
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

      {!canRealApply ? (
        <section className="tm-notice-warning">
          <div className="tm-notice-row">
            <p className="tm-typo-body">
              <span className="tm-typo-body-emphasis">{t("unsupported.alphaNotExecutable.title")}</span>{" "}
              {t("unsupported.alphaNotExecutable.description")}
            </p>
          </div>
        </section>
      ) : null}

      <DecisionSection title={t("knowledgeDetail.section.summary")}>
        <p className="tm-typo-body">{knowledge.overview.summary}</p>
      </DecisionSection>

      <dl className="tm-layout-grid md:grid-cols-3">
        <div className="tm-card-metadata">
          <dt className="tm-label">{t("knowledgeDetail.label.expectedBenefit")}</dt>
          <dd className="tm-value">{translateBenefitLevel(knowledge.decisionSupport.expectedBenefit)}</dd>
        </div>
        <div className="tm-card-metadata">
          <dt className="tm-label">{t("knowledgeDetail.label.confidence")}</dt>
          <dd className="tm-value">{translateConfidenceLevel(knowledge.decisionSupport.confidence)}</dd>
        </div>
        <div className="tm-card-metadata">
          <dt className="tm-label">{t("knowledgeDetail.label.recommendation")}</dt>
          <dd className="tm-value">{translateRecommendation(recommendation.recommendation)}</dd>
        </div>
      </dl>

      <div className="tm-layout-grid xl:grid-cols-2">
        <BulletListSection title={t("knowledgeDetail.section.tradeoffs")} items={tradeOffItems} />
        <DecisionSection title={t("knowledgeDetail.section.risks")}>
          <p>{knowledge.risks.riskExplanation}</p>
          {knowledge.risks.whenNotToUse.length > 0 ? (
            <ul className="tm-mt-md tm-layout-stack tm-typo-body">
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
        <dl className="tm-form-grid md:grid-cols-2">
          <div>
            <dt className="tm-label">{t("knowledgeDetail.label.recoveryMethod")}</dt>
            <dd className="tm-mt-sm tm-typo-body">{knowledge.recovery.recoveryMethod}</dd>
          </div>
          <div>
            <dt className="tm-label">{t("knowledgeDetail.label.recoveryDifficulty")}</dt>
            <dd className="tm-mt-sm tm-typo-body">{knowledge.recovery.recoveryDifficulty}</dd>
          </div>
          {recoveryTime !== "Unknown" ? (
            <div>
              <dt className="tm-label">{t("knowledgeDetail.label.estimatedRecoveryTime")}</dt>
              <dd className="tm-mt-sm tm-typo-body">{recoveryTime}</dd>
            </div>
          ) : null}
        </dl>
      </DecisionSection>

      <DecisionSection title={t("knowledgeDetail.section.runtimeScan")}>
        <dl className="tm-form-grid md:grid-cols-2">
          <div>
            <dt className="tm-label">{t("knowledgeDetail.label.scanCapability")}</dt>
            <dd className="tm-mt-sm tm-value">{translateScanCapability(scanCapability.scanCapability)}</dd>
          </div>
          <div>
            <dt className="tm-label">{t("knowledgeDetail.label.detectionMethod")}</dt>
            <dd className="tm-mt-sm tm-typo-body">{scanCapability.detectionMethod}</dd>
          </div>
          <div>
            <dt className="tm-label">{t("knowledgeDetail.label.runtimeScanStatus")}</dt>
            <dd className="tm-mt-sm tm-value">{translateRuntimeScanStatus(runtimeScanStatus, t)}</dd>
          </div>
          <div>
            <dt className="tm-label">{t("knowledgeDetail.label.currentRuntimeState")}</dt>
            <dd className="tm-mt-sm tm-value">{translateScanDisplayState(currentScanState)}</dd>
          </div>
          <div>
            <dt className="tm-label">{t("knowledgeDetail.label.detectionConfidence")}</dt>
            <dd className="tm-mt-sm tm-value">
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
        <p className="tm-typo-body">{knowledge.decisionSupport.decisionNotes}</p>
      </DecisionSection>

      {knowledge.learning.relatedOptimizations.length > 0 ? (
        <DecisionSection title={t("knowledgeDetail.section.relatedOptimizations")}>
          <div className="flex flex-wrap tm-gap-sm">
            {knowledge.learning.relatedOptimizations.map((relatedId) => {
              const related = KnowledgeRepository.getById(relatedId);
              if (!related) {
                return null;
              }

              return (
                <Link
                  className="tm-tag"
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

      <footer className="tm-footer lg:flex-row">
        <Link
          className="tm-button-secondary"
          to={backTarget}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          {backLabel}
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row">
          {historyEntries.length > 0 ? (
            <Link
              className="tm-button-secondary"
              to="/history"
            >
              {t("knowledgeDetail.action.viewHistory")}
            </Link>
          ) : null}

          {applyPlan.canApply ? (
            <Link
              className="tm-button-primary"
              to={`/confirm/${knowledge.identity.id}?from=${applyFrom}`}
            >
              {t("knowledgeDetail.action.apply")}
            </Link>
          ) : (
            <button
              className="tm-button-disabled"
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
