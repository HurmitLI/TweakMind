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
  Verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Failed: "border-rose-200 bg-rose-50 text-rose-700",
  "Pending / Not Available": "border-amber-200 bg-amber-50 text-amber-700"
};

const statusIcons = {
  Verified: CheckCircle2,
  Failed: AlertTriangle,
  "Pending / Not Available": Clock
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-slate-950">{value}</dd>
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
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-white/70 bg-white/85 px-8 py-8 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">{t("verify.eyebrow")}</p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">{optimization.title}</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{t("verify.subtitle")}</p>
          </div>
          <span className={["inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold", statusStyles[status]].join(" ")}>
            <StatusIcon className={isVerifying ? "animate-spin" : ""} size={16} aria-hidden="true" />
            {isVerifying ? checkingLabel : translateVerificationStatus(status)}
          </span>
        </div>
      </section>

      <dl className="grid gap-4 md:grid-cols-3">
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
        <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">{t("verify.result.title")}</h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">{translateRuntimeMessage(result?.message)}</p>
          <p className="mt-4 text-sm leading-6 text-slate-500">{t("verify.result.readOnlyNote")}</p>
        </section>
      )}

      <footer className="flex flex-col-reverse gap-3 rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          to="/dashboard"
        >
          {t("common.action.returnHome")}
        </Link>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          to="/history"
        >
          <History size={17} aria-hidden="true" />
          {t("common.action.openHistory")}
        </Link>
      </footer>
    </div>
  );
}
