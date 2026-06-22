import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { OptimizationCapabilityRegistry } from "../core/execution/OptimizationCapabilityRegistry";
import { useTranslation } from "../core/localization/LanguageProvider";
import { translateOptimizationStatus, translateRiskLevel } from "../core/localization/localizationHelpers";
import { translateRuntimeMessage } from "../core/localization/RuntimeMessageLocalizationService";
import { WindowsOptimizationService } from "../core/windows/WindowsOptimizationService";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="tm-field">
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
    entry.applyMode !== "real"
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
      <div className="tm-page-center">
        <section className="w-full max-w-3xl rounded-lg border border-amber-100 bg-white/90 p-8 text-center shadow-sm backdrop-blur dark:border-amber-500/40 dark:bg-slate-900/90">
          <h2 className="tm-title">{t("recoveryConfirm.unavailable.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">{t("recoveryConfirm.unavailable.description")}</p>
          <Link className="mt-8 tm-button-primary" to="/history">
            {t("common.action.openHistory")}
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="tm-page">
      <Link className="tm-button-ghost" to="/history">
        <ArrowLeft size={17} aria-hidden="true" />
        {t("common.action.cancel")}
      </Link>

      <section className="tm-hero">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="tm-eyebrow">{t("recoveryConfirm.eyebrow")}</p>
            <h2 className="tm-title">{entry.optimizationName}</h2>
            <p className="tm-subtitle">
              {t("recoveryConfirm.subtitle", { name: entry.optimizationName })}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            <ShieldCheck size={16} aria-hidden="true" />
            {t("recoveryConfirm.badge.realRecovery")}
          </span>
        </div>
      </section>

      <dl className="grid gap-4 md:grid-cols-3">
        <Field label={t("recoveryConfirm.label.currentState")} value={translateOptimizationStatus(entry.recoveryActualState ?? entry.newState)} />
        <Field label={t("recoveryConfirm.label.previousSavedState")} value={translateOptimizationStatus(entry.previousState)} />
        <Field label={t("recoveryConfirm.label.expectedRestoredState")} value={translateOptimizationStatus(entry.previousState)} />
        <Field label={t("recoveryConfirm.label.recoveryTime")} value={t("recoveryConfirm.value.recoveryTime")} />
        <Field label={t("recoveryConfirm.label.risk")} value={translateRiskLevel("Low")} />
        <Field label={t("recoveryConfirm.label.startupConfiguration")} value={translateRuntimeMessage(entry.previousStartupType)} />
      </dl>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="tm-panel">
          <h3 className="tm-section-title">{t("recoveryConfirm.section.whatWillChange")}</h3>
          <p className="mt-4 tm-body">
            {t("recoveryConfirm.whatWillChange.body", { name: entry.optimizationName, state: entry.previousState })}
          </p>
        </section>

        <section className="tm-panel">
          <h3 className="tm-section-title">{t("recoveryConfirm.section.recoveryMethod")}</h3>
          <p className="mt-4 tm-body">{t("recoveryConfirm.recoveryMethod.body")}</p>
          {entry.optimizationId === "sysmain" ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100">
              {t("recoveryConfirm.notice.sysmain")}
            </p>
          ) : null}
          {entry.optimizationId === "hags" ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100">
              {t("recoveryConfirm.notice.hags")}
            </p>
          ) : null}
          {entry.optimizationId === "power-plan" ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100">
              {t("recoveryConfirm.notice.powerPlan")}
            </p>
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
          to={`/recovery?historyId=${entry.id}`}
        >
          {t("recoveryConfirm.action.confirmRecovery")}
        </Link>
      </footer>
    </div>
  );
}
