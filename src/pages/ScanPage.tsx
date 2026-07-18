import { ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ErrorPresentation } from "../components/error/ErrorPresentation";
import { ScanChecklistItem } from "../components/scan/ScanChecklistItem";
import { ErrorPresentationService } from "../core/error/ErrorPresentationService";
import { useTranslation } from "../core/localization/LanguageProvider";
import { ScanManager } from "../core/scan/ScanManager";
import { startScanPageLifecycle } from "../core/scan/ScanPageLifecycle";
import { readStoredScanResult } from "../core/scan/ScanResult";

const scanItemKeys = [
  "scan.checklist.windowsConfiguration",
  "scan.checklist.services",
  "scan.checklist.gamingSettings",
  "scan.checklist.privacy",
  "scan.checklist.power",
  "scan.checklist.security"
] as const;

const scanDurationMs = 5400;
const scanTickMs = 120;

export function ScanPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const existingScan = useMemo(() => readStoredScanResult(), []);
  const [rescanConfirmed, setRescanConfirmed] = useState(existingScan === null);
  const [progress, setProgress] = useState(0);
  const [scanFailure, setScanFailure] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const scanItems = useMemo(() => scanItemKeys.map((key) => t(key)), [t]);

  useEffect(() => {
    if (!rescanConfirmed) {
      return;
    }

    setScanFailure(null);
    setProgress(0);

    const lifecycle = startScanPageLifecycle({
      runScan: ({ onProgress }) =>
        ScanManager.run({
          onProgress(progressUpdate) {
            onProgress(progressUpdate.progress);
          }
        }),
      scanDurationMs,
      scanTickMs,
      onProgress: setProgress,
      onSucceeded() {
        navigate("/report");
      },
      onFailed(errorMessage) {
        setScanFailure(errorMessage);
      }
    });

    return () => {
      lifecycle.dispose();
    };
  }, [navigate, rescanConfirmed, retryCount]);

  const completedItems = useMemo(
    () => Math.min(scanItems.length, Math.floor((progress / 100) * (scanItems.length + 1))),
    [progress, scanItems.length]
  );

  const activeItemIndex = Math.min(scanItems.length - 1, completedItems);
  const scanErrorDescriptor = scanFailure
    ? ErrorPresentationService.fromTechnicalError(scanFailure, "scan", {
        type: "unknown-error"
      })
    : null;

  if (!rescanConfirmed && existingScan) {
    return (
      <div className="tm-centered-shell">
        <section className="tm-centered-card">
          <h2 className="tm-typo-page">{t("scan.rescan.title")}</h2>
          <p className="tm-mt-md mx-auto max-w-xl tm-typo-body">{t("scan.rescan.description")}</p>
          <div className="tm-mt-lg flex flex-col justify-center tm-gap-sm sm:flex-row">
            <Link className="tm-button-secondary" to="/dashboard">
              {t("scan.rescan.action.cancel")}
            </Link>
            <button className="tm-button-secondary" onClick={() => setRescanConfirmed(true)} type="button">
              {t("scan.rescan.action.confirmRescan")}
            </button>
            <Link className="tm-button-primary" to="/report">
              {t("scan.rescan.action.viewReport")}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (scanErrorDescriptor) {
    return (
      <div className="tm-centered-shell">
        <section className="tm-card-hero tm-layout-section w-full max-w-3xl">
          <div className="flex items-start tm-gap-md">
            <div className="tm-icon-tile">
              <ShieldCheck size={23} aria-hidden="true" />
            </div>
            <div>
              <p className="tm-eyebrow">{t("scan.eyebrow")}</p>
              <h2 className="tm-typo-page">{t("scan.title")}</h2>
              <p className="tm-subtitle">{t("scan.subtitle")}</p>
            </div>
          </div>

          <div className="tm-mt-lg">
            <ErrorPresentation
              actions={{
                goBackHref: "/dashboard",
                onRetry: () => {
                  setProgress(0);
                  setScanFailure(null);
                  setRetryCount((count) => count + 1);
                }
              }}
              descriptor={scanErrorDescriptor}
            />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="tm-centered-shell">
      <section className="tm-card-hero tm-layout-section w-full max-w-3xl">
        <div className="flex items-start tm-gap-md">
          <div className="tm-icon-tile">
            <ShieldCheck size={23} aria-hidden="true" />
          </div>
          <div>
            <p className="tm-eyebrow">{t("scan.eyebrow")}</p>
            <h2 className="tm-typo-page">{t("scan.title")}</h2>
            <p className="tm-subtitle">{t("scan.subtitle")}</p>
          </div>
        </div>

        <div className="tm-mt-lg">
          <div className="tm-progress-header">
            <span>{t("scan.progress.label")}</span>
            <span>{progress}%</span>
          </div>
          <div className="tm-progress-track">
            <div className="tm-progress-value" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <ul className="tm-mt-lg tm-layout-grid sm:grid-cols-2">
          {scanItems.map((item, index) => (
            <ScanChecklistItem
              active={completedItems < scanItems.length && index === activeItemIndex}
              complete={index < completedItems}
              key={scanItemKeys[index]}
              label={item}
            />
          ))}
        </ul>

        <p className="tm-mt-lg text-center tm-typo-caption">{t("scan.waitMessage")}</p>
      </section>
    </div>
  );
}
