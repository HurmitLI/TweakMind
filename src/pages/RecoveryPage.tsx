import { Check, Clock, History, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorPresentation } from "../components/error/ErrorPresentation";
import { ErrorPresentationService } from "../core/error/ErrorPresentationService";
import { OptimizationExecutor } from "../core/windows/OptimizationExecutor";
import {
  readPendingRecoveryResult,
  storePendingRecoveryResult,
  type OptimizationRecoveryResult,
  WindowsOptimizationService
} from "../core/windows/WindowsOptimizationService";

const recoverySteps = [
  "Reading saved state",
  "Applying recovery",
  "Verifying recovery",
  "Recording recovery",
  "Completed"
];

const stepDurationMs = 1000;

export function RecoveryPage() {
  const [searchParams] = useSearchParams();
  const historyEntryId = searchParams.get("historyId") ?? "";
  const entry = historyEntryId ? WindowsOptimizationService.getHistoryEntry(historyEntryId) : undefined;
  const [result, setResult] = useState<OptimizationRecoveryResult | null>(() =>
    historyEntryId ? readPendingRecoveryResult(historyEntryId) : null
  );
  const [progress, setProgress] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!entry || result || hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    void OptimizationExecutor.restore(entry).then((recoveryResult) => {
      storePendingRecoveryResult(recoveryResult);
      setResult(recoveryResult);
    });
  }, [entry, result]);

  useEffect(() => {
    if (!entry) {
      return;
    }

    const startedAt = Date.now();
    const totalDuration = recoverySteps.length * stepDurationMs;

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProgress(result ? 100 : nextProgress);

      if (result || nextProgress >= 100) {
        window.clearInterval(intervalId);
      }
    }, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [entry, result]);

  const completed = progress >= 100 && result !== null;
  const activeStepIndex = useMemo(
    () => Math.min(recoverySteps.length - 1, Math.floor((progress / 100) * recoverySteps.length)),
    [progress]
  );
  const estimatedRemainingSeconds = Math.max(0, Math.ceil(((100 - progress) / 100) * 5));

  if (!entry) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <ErrorPresentation
          actions={{
            goBackHref: "/history",
            historyHref: "/history"
          }}
          descriptor={ErrorPresentationService.forRecoveryUnavailable()}
          layout="centered"
        />
      </div>
    );
  }

  if (completed) {
    const isSuccess = result.status === "success";
    const recoveryError = ErrorPresentationService.fromRecoveryResult(result);

    if (!isSuccess && recoveryError) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <ErrorPresentation
            actions={{
              goBackHref: "/history",
              historyHref: "/history",
              retryHref: `/recovery?historyId=${entry.id}`
            }}
            descriptor={recoveryError}
            layout="centered"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-1 items-center justify-center">
        <section className="w-full max-w-3xl rounded-lg border border-emerald-100 bg-white/90 p-8 text-center shadow-sm backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check size={28} aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">Recovery completed successfully.</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            {result.message ?? "Recovery result was recorded in History."}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950" to="/history">
              <History size={17} aria-hidden="true" />
              Open History
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              to={`/verify?id=${entry.optimizationId}&mode=recovery&historyId=${entry.id}`}
            >
              <ShieldCheck size={17} aria-hidden="true" />
              Verify Recovery
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <section className="w-full max-w-3xl rounded-lg border border-white/70 bg-white/90 p-8 shadow-sm backdrop-blur">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
            <Loader2 className="animate-spin" size={23} aria-hidden="true" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">Real Recovery flow</p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">Recovering Optimization</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Restoring the saved optimization configuration...</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50/80 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current optimization</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{entry.optimizationName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected restored state</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{entry.previousState}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current step</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{recoverySteps[activeStepIndex]}</p>
            </div>
            <div className="sm:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated remaining</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-950">
                <Clock size={15} aria-hidden="true" />
                {estimatedRemainingSeconds}s
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-600">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <ol className="mt-8 grid gap-3">
          {recoverySteps.map((step, index) => {
            const isDone = index < activeStepIndex;
            const isActive = index === activeStepIndex;

            return (
              <li
                className={[
                  "flex items-center gap-3 rounded-lg border px-4 py-3 transition",
                  isDone
                    ? "border-emerald-100 bg-white text-slate-950"
                    : isActive
                      ? "border-blue-200 bg-blue-50 text-slate-950"
                      : "border-slate-200 bg-white/60 text-slate-400"
                ].join(" ")}
                key={step}
              >
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                    isDone
                      ? "border-emerald-200 bg-emerald-500 text-white"
                      : isActive
                        ? "border-blue-200 bg-blue-600 text-white"
                        : "border-slate-200 bg-slate-100 text-transparent"
                  ].join(" ")}
                >
                  {isDone ? <Check size={16} aria-hidden="true" /> : isActive ? <Loader2 className="animate-spin" size={15} aria-hidden="true" /> : null}
                </span>
                <span className="text-sm font-medium">{step}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
