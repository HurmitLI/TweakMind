type WorkflowStep = "Knowledge" | "Scan" | "Decision" | "Apply" | "Verify" | "Recover";

const steps: WorkflowStep[] = ["Knowledge", "Scan", "Decision", "Apply", "Verify", "Recover"];

interface OptimizationWorkflowStripProps {
  currentStep: WorkflowStep;
}

export function OptimizationWorkflowStrip({ currentStep }: OptimizationWorkflowStripProps) {
  return (
    <nav aria-label="Optimization workflow" className="rounded-lg border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
      <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 sm:gap-3 sm:text-sm">
        {steps.map((step, index) => {
          const isCurrent = step === currentStep;
          const isComplete = steps.indexOf(currentStep) > index;

          return (
            <li className="flex items-center gap-2 sm:gap-3" key={step}>
              <span
                className={[
                  "rounded-full border px-3 py-1",
                  isCurrent
                    ? "border-blue-200 bg-blue-600 text-white"
                    : isComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                ].join(" ")}
              >
                {step}
              </span>
              {index < steps.length - 1 ? <span aria-hidden="true">→</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
