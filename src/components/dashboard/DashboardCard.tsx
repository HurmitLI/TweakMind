import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../core/localization/LanguageProvider";

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
  actionLabel,
  to,
  icon: Icon,
  tone
}: DashboardCardProps) {
  const { t } = useTranslation();
  const resolvedActionLabel = actionLabel ?? t("common.action.open");
  const isPrimary = tone === "primary";

  return (
    <Link
      className={[
        "group flex min-h-52 flex-col justify-between rounded-lg border p-6 transition duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        isPrimary
          ? "border-blue-300 bg-gradient-to-br from-white via-blue-50 to-cyan-50 shadow-lg shadow-blue-100/70 ring-1 ring-blue-100 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-xl dark:border-blue-500/50 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 dark:shadow-blue-950/20 dark:ring-blue-500/20"
          : "border-slate-200 bg-white/90 shadow-sm hover:border-slate-300 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-slate-600"
      ].join(" ")}
      to={to}
    >
      <div className="space-y-5">
        <div
          className={[
            "flex h-12 w-12 items-center justify-center rounded-lg border",
            isPrimary
              ? "border-blue-200 bg-blue-600 text-white shadow-sm shadow-blue-600/30 dark:border-blue-400/40"
              : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          ].join(" ")}
        >
          <Icon size={22} aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h3 className={["font-semibold tracking-tight text-slate-950 dark:text-slate-100", isPrimary ? "text-2xl" : "text-xl"].join(" ")}>{title}</h3>
          <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
          {helperText ? <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{helperText}</p> : null}
          {metaText ? <p className="text-xs font-medium text-blue-700 dark:text-blue-300">{metaText}</p> : null}
        </div>
      </div>
      <span
        className={[
          "mt-8 inline-flex items-center gap-2 text-sm font-semibold transition",
          isPrimary
            ? "w-fit rounded-lg bg-blue-600 px-4 py-2.5 text-white shadow-sm shadow-blue-600/25 group-hover:bg-blue-700"
            : "text-slate-600 group-hover:text-slate-950 dark:text-slate-300 dark:group-hover:text-white"
        ].join(" ")}
      >
        {resolvedActionLabel}
        {isPrimary ? <ArrowRight size={16} aria-hidden="true" /> : null}
      </span>
    </Link>
  );
}
