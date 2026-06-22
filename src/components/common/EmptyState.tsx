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
    <section className="rounded-lg border border-dashed border-slate-200 bg-white/90 p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
        <Icon size={22} aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      {actionLabel && actionTo ? (
        <Link
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          to={actionTo}
        >
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <button
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
