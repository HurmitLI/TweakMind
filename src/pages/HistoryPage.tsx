import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorPresentation } from "../components/error/ErrorPresentation";
import { ErrorPresentationService } from "../core/error/ErrorPresentationService";
import { OptimizationCapabilityRegistry } from "../core/execution/OptimizationCapabilityRegistry";
import { useTranslation } from "../core/localization/LanguageProvider";
import {
  translateApplyMode,
  translateHistoryStatus,
  translateOptimizationStatus,
  translateRecoveryStatus,
  translateScanCapability,
  translateScanDisplayState,
  translateVerificationStatus
} from "../core/localization/localizationHelpers";
import { translateRuntimeMessage } from "../core/localization/RuntimeMessageLocalizationService";
import { RuntimeScanService } from "../core/scan/RuntimeScanService";
import {
  type OptimizationHistoryEntry,
  type OptimizationRecoveryStatus,
  WindowsOptimizationService
} from "../core/windows/WindowsOptimizationService";
import type { VerificationStatus } from "../core/verification/VerificationResult";

const verificationStyles: Record<VerificationStatus, string> = {
  Verified: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300",
  Failed: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-300",
  "Pending / Not Available": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300"
};

const recoveryStyles: Record<OptimizationRecoveryStatus, string> = {
  "Not Started": "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  Started: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-300",
  Success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300",
  Failed: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-300"
};

function translateRuntimeScanField(value: string, t: ReturnType<typeof useTranslation>["t"]) {
  if (value === "Native Detection" || value === "Not Supported Yet") {
    return translateScanCapability(value);
  }

  if (value === "Detected") {
    return t("scan.runtimeStatus.detected");
  }

  if (value === "Unknown") {
    return t("scan.runtimeStatus.unknown");
  }

  return translateScanDisplayState(value);
}

function canRecover(entry: OptimizationHistoryEntry) {
  const capabilities = OptimizationCapabilityRegistry.get(entry.optimizationId);

  return (
    capabilities.canRecover &&
    entry.status === "Success" &&
    entry.applyMode === "real" &&
    entry.recoveryStatus !== "Success"
  );
}

export function HistoryPage() {
  const { t } = useTranslation();
  const [history] = useState<OptimizationHistoryEntry[]>(() => WindowsOptimizationService.getHistory());

  return (
    <div className="tm-page">
      <section className="tm-hero">
        <p className="tm-eyebrow">{t("history.eyebrow")}</p>
        <h2 className="tm-title">{t("history.title")}</h2>
        <p className="tm-subtitle">{t("history.subtitle")}</p>
      </section>

      <section className="grid gap-4">
        {history.length === 0 ? (
          <EmptyState
            actionLabel={t("history.empty.action")}
            actionTo="/scan"
            description={t("history.empty.description")}
            title={t("history.empty.title")}
          />
        ) : (
          history.map((entry) => {
            const historyError = ErrorPresentationService.forHistoryEntry(entry);
            const verificationStatus = entry.verificationStatus ?? "Pending / Not Available";
            const recoveryStatus = entry.recoveryStatus ?? "Not Started";

            return (
              <article className="tm-card" key={entry.id}>
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{entry.optimizationName}</h3>
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {translateHistoryStatus(entry.status)}
                      </span>
                      <span
                        className={[
                          "rounded-full border px-3 py-1 text-xs font-semibold",
                          verificationStyles[verificationStatus]
                        ].join(" ")}
                      >
                        {t("history.entry.verificationPrefix")} {translateVerificationStatus(verificationStatus)}
                      </span>
                      <span
                        className={[
                          "rounded-full border px-3 py-1 text-xs font-semibold",
                          recoveryStyles[recoveryStatus]
                        ].join(" ")}
                      >
                        {t("history.entry.recoveryPrefix")} {translateRecoveryStatus(recoveryStatus)}
                      </span>
                    </div>
                    <p className="mt-2 tm-body">
                      {historyError ? t("history.entry.needsReview") : translateRuntimeMessage(entry.recoveryMessage ?? entry.message)}
                    </p>
                    {historyError ? (
                      <div className="mt-4">
                        <ErrorPresentation
                          actions={{
                            goBackHref: "/dashboard",
                            historyHref: "/history",
                            retryHref:
                              entry.recoveryStatus === "Failed"
                                ? `/recovery?historyId=${entry.id}`
                                : entry.verificationStatus === "Failed"
                                  ? `/verify?id=${entry.optimizationId}&mode=${entry.recoveryStatus === "Success" ? "recovery" : "apply"}&historyId=${entry.id}`
                                  : `/confirm/${entry.optimizationId}?from=decision`
                          }}
                          descriptor={historyError}
                        />
                      </div>
                    ) : null}
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                      <div className="tm-mini-card">
                        <dt className="tm-label">{t("history.label.applyMode")}</dt>
                        <dd className="tm-value">
                          {entry.applyMode ? translateApplyMode(entry.applyMode) : t("common.value.unknown")}
                        </dd>
                      </div>
                      <div className="tm-mini-card">
                        <dt className="tm-label">{t("history.label.previousState")}</dt>
                        <dd className="tm-value">{translateOptimizationStatus(entry.previousState)}</dd>
                      </div>
                      <div className="tm-mini-card">
                        <dt className="tm-label">{t("history.label.newState")}</dt>
                        <dd className="tm-value">{translateOptimizationStatus(entry.newState)}</dd>
                      </div>
                      <div className="tm-mini-card">
                        <dt className="tm-label">{t("history.label.verifiedActual")}</dt>
                        <dd className="tm-value">{translateOptimizationStatus(entry.verificationActualState ?? "Unknown")}</dd>
                      </div>
                      <div className="tm-mini-card">
                        <dt className="tm-label">{t("history.label.recoveryActual")}</dt>
                        <dd className="tm-value">{translateOptimizationStatus(entry.recoveryActualState ?? "Unknown")}</dd>
                      </div>
                      <div className="tm-mini-card">
                        <dt className="tm-label">{t("history.label.timestamp")}</dt>
                        <dd className="tm-value">{new Date(Number(entry.timestamp) * 1000).toLocaleString()}</dd>
                      </div>
                      <div className="tm-mini-card">
                        <dt className="tm-label">{t("history.label.runtimeScan")}</dt>
                        <dd className="tm-value">
                          {translateRuntimeScanField(
                            RuntimeScanService.getStoredSnapshot(entry.optimizationId)?.runtimeScanStatus ??
                              RuntimeScanService.getCapability(entry.optimizationId).scanCapability,
                            t
                          )}
                        </dd>
                      </div>
                      <div className="tm-mini-card">
                        <dt className="tm-label">{t("history.label.scanState")}</dt>
                        <dd className="tm-value">{translateScanDisplayState(RuntimeScanService.getDisplayState(entry.optimizationId))}</dd>
                      </div>
                    </dl>
                  </div>

                {canRecover(entry) ? (
                  <Link
                    className="tm-button-primary"
                    to={`/recover/${entry.id}`}
                  >
                    {t("history.action.restore")}
                  </Link>
                ) : (
                  <button
                    className="tm-button-disabled"
                    disabled
                    type="button"
                  >
                    {entry.recoveryStatus === "Success" ? t("history.action.recovered") : t("history.action.recoveryUnavailable")}
                  </button>
                )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
