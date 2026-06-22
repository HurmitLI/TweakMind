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
}

export function EmptyState({ title, description, actionLabel, actionTo, onAction, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-slate-200 bg-white/90 p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <Icon size={22} aria-hidden="true" />
      </div>
      <h3 className="mt-4 tm-section-title">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl tm-body">{description}</p>
      {actionLabel && actionTo ? (
        <Link className="mt-6 tm-button-primary" to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <button className="mt-6 tm-button-primary" onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
