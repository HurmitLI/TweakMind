import { Check, Clock, Home, History, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { OptimizationRepository } from "../core/optimization/OptimizationRepository";
import { OptimizationExecutor } from "../core/windows/OptimizationExecutor";
import type { OptimizationExecutionResult } from "../core/windows/WindowsOptimizationService";
import type { OptimizationId } from "../types/optimization";

const applySteps = [
  "Creating restore point...",
  "Applying optimization...",
  "Verifying configuration...",
  "Finishing..."
];

const stepDurationMs = 1150;

export function ApplyPage() {
  const [searchParams] = useSearchParams();
  const defaultOptimization = OptimizationRepository.getDefault();
  const requestedOptimizationId = (searchParams.get("id") as OptimizationId | null) ?? defaultOptimization.id;
  const optimization =
    OptimizationRepository.getById(requestedOptimizationId) ?? defaultOptimization;
  const [progress, setProgress] = useState(0);
  const [executionResult, setExecutionResult] = useState<OptimizationExecutionResult | null>(null);
  const startedApplyRef = useRef(false);

  useEffect(() => {
    if (!startedApplyRef.current) {
      startedApplyRef.current = true;
      void OptimizationExecutor.apply(optimization.id).then(setExecutionResult);
    }

    const startedAt = Date.now();
    const totalDuration = applySteps.length * stepDurationMs;

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        window.clearInterval(intervalId);
      }
    }, 120);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [optimization.id]);

  const completed = progress >= 100 && executionResult !== null;
  const activeStepIndex = useMemo(
    () => Math.min(applySteps.length - 1, Math.floor((progress / 100) * applySteps.length)),
    [progress]
  );
  const estimatedRemainingSeconds = Math.max(0, Math.ceil(((100 - progress) / 100) * 5));

  if (completed) {
    const isSuccess = executionResult?.status === "Success";
    const title = isSuccess ? "Optimization completed successfully." : "Optimization could not be completed.";
    const message =
      executionResult?.message ??
      "TweakMind could not confirm whether the optimization completed. Please review History before trying again.";

    return (
      <div className="flex flex-1 items-center justify-center">
        <section className="w-full max-w-3xl rounded-lg border border-emerald-100 bg-white/90 p-8 text-center shadow-sm backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check size={28} aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            {isSuccess ? "Everything can be restored later from History." : message}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
              to="/dashboard"
            >
              <Home size={17} aria-hidden="true" />
              Return Home
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              to="/history"
            >
              <History size={17} aria-hidden="true" />
              Open History
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
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">Mock apply flow</p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">Applying Optimizations</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Preparing your Windows configuration...</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50/80 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current optimization</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{optimization.title}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current step</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{applySteps[activeStepIndex]}</p>
            </div>
            <div>
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
          {applySteps.map((step, index) => {
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
