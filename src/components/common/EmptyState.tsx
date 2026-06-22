import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  variant?: "default" | "comfortable";
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  icon: Icon = Inbox,
  variant = "default"
}: EmptyStateProps) {
  const isComfortable = variant === "comfortable";

  return (
    <section
      className={[
        "tm-empty-state",
        isComfortable ? "py-14" : "py-10"
      ].join(" ")}
    >
      <div className={isComfortable ? "tm-empty-state-icon" : "mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100/80 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500"}>
        <Icon size={isComfortable ? 28 : 22} aria-hidden="true" />
      </div>
      <h3 className={["tm-section-title", isComfortable ? "mt-6" : "mt-4"].join(" ")}>{title}</h3>
      <p className={["mx-auto max-w-xl tm-body-secondary", isComfortable ? "mt-3" : "mt-2"].join(" ")}>{description}</p>
      {actionLabel && actionTo ? (
        <Link className={isComfortable ? "mt-4 tm-button-primary" : "mt-6 tm-button-primary"} to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <button className={isComfortable ? "mt-4 tm-button-primary" : "mt-6 tm-button-primary"} onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
