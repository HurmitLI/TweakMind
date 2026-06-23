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
  Verified: "tm-status-badge-success",
  Failed: "tm-status-badge-danger",
  "Pending / Not Available": "tm-status-badge-warning"
};

const recoveryStyles: Record<OptimizationRecoveryStatus, string> = {
  "Not Started": "tm-status-badge",
  Started: "tm-status-badge-warning",
  Success: "tm-status-badge-success",
  Failed: "tm-status-badge-danger"
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
    <div className="tm-layout-page">
      <section className="tm-card-hero">
        <p className="tm-eyebrow">{t("history.eyebrow")}</p>
        <h2 className="tm-typo-page">{t("history.title")}</h2>
        <p className="tm-subtitle">{t("history.subtitle")}</p>
      </section>

      <section className="tm-layout-grid">
        {history.length === 0 ? (
          <EmptyState
            actionLabel={t("history.empty.action")}
            actionTo="/scan"
            description={t("history.empty.description")}
            title={t("history.empty.title")}
            variant="comfortable"
          />
        ) : (
          history.map((entry) => {
            const historyError = ErrorPresentationService.forHistoryEntry(entry);
            const verificationStatus = entry.verificationStatus ?? "Pending / Not Available";
            const recoveryStatus = entry.recoveryStatus ?? "Not Started";

            return (
              <article className="tm-card-hover" key={entry.id}>
                <div className="flex flex-col tm-gap-md md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center tm-gap-sm">
                      <h3 className="tm-typo-body-emphasis">{entry.optimizationName}</h3>
                      <span className="tm-status-badge">{translateHistoryStatus(entry.status)}</span>
                      <span className={["tm-status-badge", verificationStyles[verificationStatus]].join(" ")}>
                        {t("history.entry.verificationPrefix")} {translateVerificationStatus(verificationStatus)}
                      </span>
                      <span className={["tm-status-badge", recoveryStyles[recoveryStatus]].join(" ")}>
                        {t("history.entry.recoveryPrefix")} {translateRecoveryStatus(recoveryStatus)}
                      </span>
                    </div>
                    <p className="tm-mt-md tm-typo-body">
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
                                ? `/recover/${entry.id}`
                                : entry.verificationStatus === "Failed"
                                  ? `/verify?id=${entry.optimizationId}&mode=${entry.recoveryStatus === "Success" ? "recovery" : "apply"}&historyId=${entry.id}`
                                  : `/confirm/${entry.optimizationId}?from=decision`
                          }}
                          descriptor={historyError}
                        />
                      </div>
                    ) : null}
                    <dl className="tm-mt-lg tm-form-grid sm:grid-cols-2 xl:grid-cols-4">
                      <div className="tm-card-metadata">
                        <dt className="tm-label">{t("history.label.applyMode")}</dt>
                        <dd className="tm-value">
                          {entry.applyMode ? translateApplyMode(entry.applyMode) : t("common.value.unknown")}
                        </dd>
                      </div>
                      <div className="tm-card-metadata">
                        <dt className="tm-label">{t("history.label.previousState")}</dt>
                        <dd className="tm-value">{translateOptimizationStatus(entry.previousState)}</dd>
                      </div>
                      <div className="tm-card-metadata">
                        <dt className="tm-label">{t("history.label.newState")}</dt>
                        <dd className="tm-value">{translateOptimizationStatus(entry.newState)}</dd>
                      </div>
                      <div className="tm-card-metadata">
                        <dt className="tm-label">{t("history.label.verifiedActual")}</dt>
                        <dd className="tm-value">{translateOptimizationStatus(entry.verificationActualState ?? "Unknown")}</dd>
                      </div>
                      <div className="tm-card-metadata">
                        <dt className="tm-label">{t("history.label.recoveryActual")}</dt>
                        <dd className="tm-value">{translateOptimizationStatus(entry.recoveryActualState ?? "Unknown")}</dd>
                      </div>
                      <div className="tm-card-metadata">
                        <dt className="tm-label">{t("history.label.timestamp")}</dt>
                        <dd className="tm-value">{new Date(Number(entry.timestamp) * 1000).toLocaleString()}</dd>
                      </div>
                      <div className="tm-card-metadata">
                        <dt className="tm-label">{t("history.label.runtimeScan")}</dt>
                        <dd className="tm-value">
                          {translateRuntimeScanField(
                            RuntimeScanService.getStoredSnapshot(entry.optimizationId)?.runtimeScanStatus ??
                              RuntimeScanService.getCapability(entry.optimizationId).scanCapability,
                            t
                          )}
                        </dd>
                      </div>
                      <div className="tm-card-metadata">
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
