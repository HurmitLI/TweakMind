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
      <div className={isComfortable ? "tm-empty-state-icon" : "tm-empty-state-icon"}>
        <Icon size={isComfortable ? 28 : 22} aria-hidden="true" />
      </div>
      <h3 className={["tm-typo-section", isComfortable ? "tm-mt-lg" : "tm-mt-md"].join(" ")}>{title}</h3>
      <p className={["mx-auto max-w-xl tm-typo-body", isComfortable ? "tm-mt-md" : "tm-mt-sm"].join(" ")}>{description}</p>
      {actionLabel && actionTo ? (
        <Link className={isComfortable ? "tm-mt-md tm-button-primary" : "tm-mt-lg tm-button-primary"} to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <button className={isComfortable ? "tm-mt-md tm-button-primary" : "tm-mt-lg tm-button-primary"} onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
