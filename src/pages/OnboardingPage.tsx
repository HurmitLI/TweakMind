import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OnboardingService } from "../core/onboarding/OnboardingService";

const workflowSteps = [
  { title: "Knowledge", sentence: "Learn what each optimization does before you change anything." },
  { title: "Scan", sentence: "Detect current Windows states without making changes." },
  { title: "Decision", sentence: "Review recommendations and decide what fits your goals." },
  { title: "Apply", sentence: "Apply changes through the native executor, not the UI." },
  { title: "Verify", sentence: "Compare expected and actual states after a change." },
  { title: "Recover", sentence: "Restore previous settings from History when needed." }
] as const;

const stepTitles = ["Welcome", "What is TweakMind", "Workflow", "Start First Scan"] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);

  function finish(destination: "/scan" | "/knowledge" | "/dashboard") {
    OnboardingService.markComplete();
    navigate(destination, { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-slate-100">
      <div className="w-full max-w-2xl rounded-lg border border-slate-800 bg-slate-900/95 p-8 shadow-2xl backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
          Step {stepIndex + 1} of {stepTitles.length}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{stepTitles[stepIndex]}</h1>

        {stepIndex === 0 ? (
          <div className="mt-6 space-y-4 text-base leading-7 text-slate-300">
            <p>TweakMind helps you decide which Windows optimizations are worth changing.</p>
            <p className="font-medium text-slate-100">What should I do first?</p>
            <p>Start with a scan to see your current state, then review recommendations before applying anything.</p>
          </div>
        ) : null}

        {stepIndex === 1 ? (
          <div className="mt-6 space-y-4 text-base leading-7 text-slate-300">
            <p>
              TweakMind is a decision tool for Windows optimizations — not an encyclopedia and not a one-click tweaker.
            </p>
            <p>
              It shows trade-offs, scan results, and recovery options so you stay in control of what changes on your PC.
            </p>
          </div>
        ) : null}

        {stepIndex === 2 ? (
          <ol className="mt-6 grid gap-3">
            {workflowSteps.map((step, index) => (
              <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-4" key={step.title}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{step.sentence}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {stepIndex === 3 ? (
          <div className="mt-6 space-y-4 text-base leading-7 text-slate-300">
            <p>Your first step is a scan. It is read-only and helps TweakMind recommend what to review next.</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                onClick={() => finish("/scan")}
                type="button"
              >
                Start Scan
              </button>
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                onClick={() => finish("/knowledge")}
                type="button"
              >
                Explore Knowledge
              </button>
            </div>
            <button
              className="text-sm font-semibold text-slate-400 transition hover:text-slate-200"
              onClick={() => finish("/dashboard")}
              type="button"
            >
              Skip onboarding
            </button>
          </div>
        ) : null}

        {stepIndex < 3 ? (
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              className="text-sm font-semibold text-slate-400 transition hover:text-slate-200"
              onClick={() => finish("/dashboard")}
              type="button"
            >
              Skip onboarding
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
              onClick={() => setStepIndex((current) => current + 1)}
              type="button"
            >
              Continue
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <p className="mt-8 text-sm text-slate-500">
            Prefer the dashboard first?{" "}
            <Link className="font-semibold text-slate-300 hover:text-white" to="/dashboard" onClick={() => OnboardingService.markComplete()}>
              Go to Dashboard
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
