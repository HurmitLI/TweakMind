import { AlertTriangle, CheckCircle2, Clock, History, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorPresentation } from "../components/error/ErrorPresentation";
import { LoadingState } from "../components/common/LoadingState";
import { getTargetStateForOptimization } from "../core/apply/ApplyConfirmationPlan";
import { ErrorPresentationService } from "../core/error/ErrorPresentationService";
import { useTranslation } from "../core/localization/LanguageProvider";
import {
  translateConfidence,
  translateOptimizationStatus,
  translateScanCapability,
  translateScanDisplayState,
  translateVerificationStatus
} from "../core/localization/localizationHelpers";
import { translateRuntimeMessage } from "../core/localization/RuntimeMessageLocalizationService";
import { OptimizationRepository } from "../core/optimization/OptimizationRepository";
import { RuntimeScanService } from "../core/scan/RuntimeScanService";
import { VerificationService } from "../core/verification/VerificationService";
import type { VerificationResult, VerificationStatus } from "../core/verification/VerificationResult";
import type { OptimizationId } from "../types/optimization";

const statusStyles: Record<VerificationStatus, string> = {
  Verified: "tm-status-badge-success",
  Failed: "tm-status-badge-danger",
  "Pending / Not Available": "tm-status-badge-warning"
};

const statusIcons = {
  Verified: CheckCircle2,
  Failed: AlertTriangle,
  "Pending / Not Available": Clock
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="tm-card-metadata">
      <dt className="tm-label">{label}</dt>
      <dd className="tm-value">{value}</dd>
    </div>
  );
}

function translateRuntimeScanStatusLabel(value: string, t: ReturnType<typeof useTranslation>["t"]) {
  if (value === "Detected") {
    return t("scan.runtimeStatus.detected");
  }

  if (value === "Unknown") {
    return t("scan.runtimeStatus.unknown");
  }

  return translateScanDisplayState(value);
}

export function VerificationPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultOptimization = OptimizationRepository.getDefault();
  const requestedOptimizationId = (searchParams.get("id") as OptimizationId | null) ?? defaultOptimization.id;
  const mode = searchParams.get("mode") === "recovery" ? "recovery" : "apply";
  const historyEntryId = searchParams.get("historyId") ?? undefined;
  const optimization = OptimizationRepository.getById(requestedOptimizationId) ?? defaultOptimization;
  const expectedApplyState = getTargetStateForOptimization(optimization.id, optimization.recommendation, "Unknown");
  const runtimeScan = RuntimeScanService.getStoredSnapshot(optimization.id);
  const scanCapability = RuntimeScanService.getCapability(optimization.id);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    setIsVerifying(true);
    void VerificationService.verify(optimization.id, { mode, historyEntryId }).then((verificationResult) => {
      if (!isMounted) {
        return;
      }

      setResult(verificationResult);
      setIsVerifying(false);
    });

    return () => {
      isMounted = false;
    };
  }, [historyEntryId, mode, optimization.id, retryCount]);

  const status = result?.status ?? "Pending / Not Available";
  const StatusIcon = isVerifying ? Loader2 : statusIcons[status];
  const verificationError = result ? ErrorPresentationService.fromVerificationResult(result) : null;
  const checkingLabel = t("verify.status.checking");

  return (
    <div className="tm-layout-page">
      <section className="tm-card-hero">
        <div className="flex flex-col tm-gap-lg lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="tm-eyebrow">{t("verify.eyebrow")}</p>
            <h2 className="tm-typo-page">{optimization.title}</h2>
            <p className="tm-subtitle">{t("verify.subtitle")}</p>
          </div>
          <span className={["tm-status-badge", statusStyles[status]].join(" ")}>
            <StatusIcon className={isVerifying ? "animate-spin" : ""} size={16} aria-hidden="true" />
            {isVerifying ? checkingLabel : translateVerificationStatus(status)}
          </span>
        </div>
      </section>

      <dl className="tm-form-grid tm-form-grid-3">
        <Field label={t("verify.label.previousState")} value={translateOptimizationStatus(result?.previousState ?? "Unknown")} />
        <Field
          label={t("verify.label.expectedState")}
          value={translateOptimizationStatus(result?.expectedState ?? (mode === "recovery" ? "Unknown" : expectedApplyState))}
        />
        <Field
          label={t("verify.label.actualDetectedState")}
          value={isVerifying ? checkingLabel : translateOptimizationStatus(result?.actualState ?? "Unknown")}
        />
        <Field
          label={t("verify.label.runtimeScanStatus")}
          value={translateRuntimeScanStatusLabel(runtimeScan?.runtimeScanStatus ?? scanCapability.scanCapability, t)}
        />
        <Field label={t("verify.label.scanCapability")} value={translateScanCapability(scanCapability.scanCapability)} />
        <Field label={t("verify.label.detectionConfidence")} value={translateConfidence(runtimeScan?.detectionConfidence ?? "None")} />
      </dl>

      {isVerifying ? (
        <LoadingState
          description={t("verify.loading.description", { title: optimization.title })}
          title={t("verify.loading.title")}
        />
      ) : verificationError ? (
        <ErrorPresentation
          actions={{
            goBackHref: "/dashboard",
            historyHref: "/history",
            onRetry: () => setRetryCount((count) => count + 1)
          }}
          descriptor={verificationError}
        />
      ) : status === "Pending / Not Available" ? (
        <EmptyState
          actionLabel={t("common.action.openHistory")}
          actionTo="/history"
          description={result?.message ? translateRuntimeMessage(result.message) : t("verify.empty.description")}
          title={t("verify.empty.title")}
        />
      ) : (
        <section className="tm-card">
          <h3 className="tm-typo-section">{t("verify.result.title")}</h3>
          <p className="tm-mt-md tm-typo-body">{translateRuntimeMessage(result?.message)}</p>
          <p className="tm-mt-md tm-typo-caption">{t("verify.result.readOnlyNote")}</p>
        </section>
      )}

      <footer className="tm-footer">
        <Link
          className="tm-button-secondary"
          to="/dashboard"
        >
          {t("common.action.returnHome")}
        </Link>
        <Link
          className="tm-button-primary"
          to="/history"
        >
          <History size={17} aria-hidden="true" />
          {t("common.action.openHistory")}
        </Link>
      </footer>
    </div>
  );
}
