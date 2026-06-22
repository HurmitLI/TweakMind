import type { LucideIcon } from "lucide-react";

interface ReportMetricProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export function ReportMetric({ label, value, icon: Icon }: ReportMetricProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-950/40 dark:text-blue-300">
          <Icon size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-base font-semibold leading-6 text-slate-950 dark:text-slate-100">{value}</p>
        </div>
      </div>
    </div>
  );
}
