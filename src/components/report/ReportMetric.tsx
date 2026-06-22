import type { LucideIcon } from "lucide-react";

interface ReportMetricProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export function ReportMetric({ label, value, icon: Icon }: ReportMetricProps) {
  return (
    <div className="rounded-lg border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
          <Icon size={19} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}
