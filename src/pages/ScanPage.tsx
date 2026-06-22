import { ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanChecklistItem } from "../components/scan/ScanChecklistItem";
import { ScanManager } from "../core/scan/ScanManager";

const scanItems = ["Windows configuration", "Services", "Gaming settings", "Privacy", "Power", "Security"];
const scanDurationMs = 5400;
const scanTickMs = 120;

export function ScanPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

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
    [progress]
  );

  return (
    <div className="flex flex-1 items-center justify-center">
      <section className="w-full max-w-3xl rounded-lg border border-white/70 bg-white/85 p-8 shadow-sm backdrop-blur">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
            <ShieldCheck size={23} aria-hidden="true" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">System scan</p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">Analyzing your PC</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Looking for optimization opportunities...</p>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-600">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {scanItems.map((item, index) => (
            <ScanChecklistItem complete={index < completedItems} key={item} label={item} />
          ))}
        </ul>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">Please wait...</p>
      </section>
    </div>
  );
}
