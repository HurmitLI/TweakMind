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
  Verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Failed: "border-rose-200 bg-rose-50 text-rose-700",
  "Pending / Not Available": "border-amber-200 bg-amber-50 text-amber-700"
};

const recoveryStyles: Record<OptimizationRecoveryStatus, string> = {
  "Not Started": "border-slate-200 bg-slate-100 text-slate-700",
  Started: "border-blue-200 bg-blue-50 text-blue-700",
  Success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Failed: "border-rose-200 bg-rose-50 text-rose-700"
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
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold text-slate-950 dark:text-slate-100">{entry.optimizationName}</h3>
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
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
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-6">
                    <div>
                      <dt className="font-semibold text-slate-500">{t("history.label.applyMode")}</dt>
                      <dd className="mt-1 text-slate-950">
                        {entry.applyMode ? translateApplyMode(entry.applyMode) : t("common.value.unknown")}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">{t("history.label.previousState")}</dt>
                      <dd className="mt-1 text-slate-950">{translateOptimizationStatus(entry.previousState)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">{t("history.label.newState")}</dt>
                      <dd className="mt-1 text-slate-950">{translateOptimizationStatus(entry.newState)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">{t("history.label.verifiedActual")}</dt>
                      <dd className="mt-1 text-slate-950">{translateOptimizationStatus(entry.verificationActualState ?? "Unknown")}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">{t("history.label.recoveryActual")}</dt>
                      <dd className="mt-1 text-slate-950">{translateOptimizationStatus(entry.recoveryActualState ?? "Unknown")}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">{t("history.label.timestamp")}</dt>
                      <dd className="mt-1 text-slate-950">{new Date(Number(entry.timestamp) * 1000).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">{t("history.label.runtimeScan")}</dt>
                      <dd className="mt-1 text-slate-950">
                        {translateRuntimeScanField(
                          RuntimeScanService.getStoredSnapshot(entry.optimizationId)?.runtimeScanStatus ??
                            RuntimeScanService.getCapability(entry.optimizationId).scanCapability,
                          t
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">{t("history.label.scanState")}</dt>
                      <dd className="mt-1 text-slate-950">{translateScanDisplayState(RuntimeScanService.getDisplayState(entry.optimizationId))}</dd>
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
                    className="tm-button-primary"
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
