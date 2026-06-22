import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardCardProps {
  title: string;
  description: string;
  helperText?: string;
  metaText?: string;
  actionLabel?: string;
  to: string;
  icon: LucideIcon;
  tone: "primary" | "secondary";
}

export function DashboardCard({
  title,
  description,
  helperText,
  metaText,
  actionLabel = "Open",
  to,
  icon: Icon,
  tone
}: DashboardCardProps) {
  const isPrimary = tone === "primary";

  return (
    <Link
      className={[
        "group flex min-h-52 flex-col justify-between rounded-lg border p-6 shadow-sm transition duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        isPrimary
          ? "border-blue-300 bg-gradient-to-br from-white via-blue-50 to-cyan-50 shadow-md ring-1 ring-blue-100 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg"
          : "border-slate-200 bg-white/90 hover:border-slate-300 hover:bg-white hover:shadow-md"
      ].join(" ")}
      to={to}
    >
      <div className="space-y-5">
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-lg border",
            isPrimary
              ? "border-blue-200 bg-blue-600 text-white"
              : "border-slate-200 bg-slate-50 text-slate-700"
          ].join(" ")}
        >
          <Icon size={22} aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
          <p className="max-w-md text-sm leading-6 text-slate-600">{description}</p>
          {helperText ? <p className="text-xs font-semibold text-slate-600">{helperText}</p> : null}
          {metaText ? <p className="text-xs font-medium text-blue-700">{metaText}</p> : null}
        </div>
      </div>
      <span
        className={[
          "mt-8 inline-flex items-center text-sm font-semibold transition",
          isPrimary
            ? "rounded-md bg-blue-600 px-3 py-2 text-white group-hover:bg-blue-700"
            : "text-slate-600 group-hover:text-slate-950"
        ].join(" ")}
      >
        {actionLabel}
      </span>
    </Link>
  );
}
