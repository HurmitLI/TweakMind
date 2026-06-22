import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  title: string;
  description?: string;
  layout?: "inline" | "centered";
}

export function LoadingState({ title, description, layout = "inline" }: LoadingStateProps) {
  const containerClass =
    layout === "centered"
      ? "flex flex-1 items-center justify-center"
      : "tm-panel";

  return (
    <div aria-busy="true" aria-live="polite" className={containerClass} role="status">
      <div className={layout === "centered" ? "flex flex-col items-center text-center" : "flex items-start gap-3"}>
        <span
          className={[
            "flex shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700",
            layout === "centered" ? "h-12 w-12" : "h-10 w-10"
          ].join(" ")}
        >
          <Loader2 className="animate-spin" size={layout === "centered" ? 24 : 20} aria-hidden="true" />
        </span>
        <div className={layout === "centered" ? "mt-4" : ""}>
          <p className="text-base font-semibold tracking-tight text-slate-950 dark:text-slate-100">{title}</p>
          {description ? <p className="mt-2 tm-body">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}
