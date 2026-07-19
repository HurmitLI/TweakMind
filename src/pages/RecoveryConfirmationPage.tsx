import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { OptimizationCapabilityRegistry } from "../core/execution/OptimizationCapabilityRegistry";
import { useTranslation } from "../core/localization/LanguageProvider";
import { translateOptimizationStatus, translateRiskLevel } from "../core/localization/localizationHelpers";
import { translateRuntimeMessage } from "../core/localization/RuntimeMessageLocalizationService";
import {
  clearPendingRecoveryResult,
  storePendingRecoveryAuthorization,
  WindowsOptimizationService
} from "../core/windows/WindowsOptimizationService";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="tm-card-metadata">
      <dt className="tm-label">{label}</dt>
      <dd className="tm-value">{value}</dd>
    </div>
  );
}

function canRecover(entryId: string | undefined) {
  if (!entryId) {
    return undefined;
  }

  const entry = WindowsOptimizationService.getHistoryEntry(entryId);

  if (
    !entry ||
    !OptimizationCapabilityRegistry.canRecover(entry.optimizationId) ||
    entry.status !== "Success" ||
    entry.applyMode !== "real" ||
    entry.recoveryStatus === "Success"
  ) {
    return undefined;
  }

  return entry;
}

export function RecoveryConfirmationPage() {
  const { t } = useTranslation();
  const { historyId } = useParams();
  const entry = canRecover(historyId);

  if (!entry) {
    return (
      <div className="tm-centered-shell">
        <section className="tm-centered-card">
          <h2 className="tm-typo-page">{t("recoveryConfirm.unavailable.title")}</h2>
          <p className="tm-mt-md mx-auto max-w-xl tm-typo-body">{t("recoveryConfirm.unavailable.description")}</p>
          <Link className="tm-mt-lg tm-button-primary" to="/history">
            {t("common.action.openHistory")}
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="tm-layout-page">
      <Link className="tm-button-ghost" to="/history">
        <ArrowLeft size={17} aria-hidden="true" />
        {t("common.action.cancel")}
      </Link>

      <section className="tm-card-hero">
        <div className="flex flex-col tm-gap-lg lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="tm-eyebrow">{t("recoveryConfirm.eyebrow")}</p>
            <h2 className="tm-typo-page">{entry.optimizationName}</h2>
            <p className="tm-subtitle">
              {t("recoveryConfirm.subtitle", { name: entry.optimizationName })}
            </p>
          </div>
          <span className="tm-status-badge tm-status-badge-success">
            <ShieldCheck size={16} aria-hidden="true" />
            {t("recoveryConfirm.badge.realRecovery")}
          </span>
        </div>
      </section>

      <dl className="tm-form-grid tm-form-grid-3">
        <Field label={t("recoveryConfirm.label.currentState")} value={translateOptimizationStatus(entry.recoveryActualState ?? entry.newState)} />
        <Field label={t("recoveryConfirm.label.previousSavedState")} value={translateOptimizationStatus(entry.previousState)} />
        <Field label={t("recoveryConfirm.label.expectedRestoredState")} value={translateOptimizationStatus(entry.previousState)} />
        <Field label={t("recoveryConfirm.label.recoveryTime")} value={t("recoveryConfirm.value.recoveryTime")} />
        <Field label={t("recoveryConfirm.label.risk")} value={translateRiskLevel("Low")} />
        <Field label={t("recoveryConfirm.label.startupConfiguration")} value={translateRuntimeMessage(entry.previousStartupType)} />
      </dl>

      <div className="tm-layout-grid-lg xl:grid-cols-2">
        <section className="tm-card">
          <h3 className="tm-typo-section">{t("recoveryConfirm.section.whatWillChange")}</h3>
          <p className="tm-mt-md tm-typo-body">
            {t("recoveryConfirm.whatWillChange.body", {
              name: entry.optimizationName,
              state: translateOptimizationStatus(entry.previousState)
            })}
          </p>
        </section>

        <section className="tm-card">
          <h3 className="tm-typo-section">{t("recoveryConfirm.section.recoveryMethod")}</h3>
          <p className="tm-mt-md tm-typo-body">{t("recoveryConfirm.recoveryMethod.body")}</p>
          {entry.optimizationId === "sysmain" ? (
            <p className="tm-notice-warning tm-typo-body">{t("recoveryConfirm.notice.sysmain")}</p>
          ) : null}
          {entry.optimizationId === "hags" ? (
            <p className="tm-notice-warning tm-typo-body">{t("recoveryConfirm.notice.hags")}</p>
          ) : null}
          {entry.optimizationId === "power-plan" ? (
            <p className="tm-notice-warning tm-typo-body">{t("recoveryConfirm.notice.powerPlan")}</p>
          ) : null}
        </section>
      </div>

      <footer className="tm-footer">
        <Link
          className="tm-button-secondary"
          to="/history"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          {t("common.action.cancel")}
        </Link>
        <Link
          className="tm-button-primary"
          onClick={() => {
            clearPendingRecoveryResult(entry.id);
            storePendingRecoveryAuthorization(entry.id);
          }}
          to={`/recovery?historyId=${entry.id}`}
        >
          {t("recoveryConfirm.action.confirmRecovery")}
        </Link>
      </footer>
    </div>
  );
}
