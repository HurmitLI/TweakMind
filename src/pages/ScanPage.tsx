import { ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanChecklistItem } from "../components/scan/ScanChecklistItem";
import { useTranslation } from "../core/localization/LanguageProvider";
import { ScanManager } from "../core/scan/ScanManager";

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
  const [progress, setProgress] = useState(0);
  const scanItems = useMemo(() => scanItemKeys.map((key) => t(key)), [t]);

  useEffect(() => {
    const startedAt = Date.now();
    let scanCompleted = false;
    let scanProgress = 0;
    let isMounted = true;

    const scanPromise = ScanManager.run({
      onProgress(progress) {
        scanProgress = progress.progress;
      }
    });

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const animatedProgress = Math.min(100, Math.round((elapsed / scanDurationMs) * 100));
      const nextProgress = Math.min(100, Math.max(animatedProgress, scanProgress));
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        window.clearInterval(intervalId);
        window.setTimeout(() => {
          if (scanCompleted && isMounted) {
            navigate("/report");
          }
        }, 650);
      }
    }, scanTickMs);

    void scanPromise.then(() => {
      scanCompleted = true;

      if (!isMounted) {
        return;
      }

      if (Date.now() - startedAt >= scanDurationMs) {
        setProgress(100);
        window.setTimeout(() => {
          if (isMounted) {
            navigate("/report");
          }
        }, 650);
      }
    });

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [navigate]);

  const completedItems = useMemo(
    () => Math.min(scanItems.length, Math.floor((progress / 100) * (scanItems.length + 1))),
    [progress, scanItems.length]
  );

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
            <ScanChecklistItem complete={index < completedItems} key={scanItemKeys[index]} label={item} />
          ))}
        </ul>

        <p className="tm-mt-lg text-center tm-typo-caption">{t("scan.waitMessage")}</p>
      </section>
    </div>
  );
}
