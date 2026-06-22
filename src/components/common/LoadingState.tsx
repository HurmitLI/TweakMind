import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  title: string;
  description?: string;
  layout?: "inline" | "centered";
}

export function LoadingState({ title, description, layout = "inline" }: LoadingStateProps) {
  const containerClass = layout === "centered" ? "tm-loading-state-centered" : "tm-loading-state";

  return (
    <div aria-busy="true" aria-live="polite" className={containerClass} role="status">
      <div className={layout === "centered" ? "flex flex-col items-center text-center" : "flex items-start tm-gap-sm"}>
        <span
          className={[
            "tm-loading-state-icon",
            layout === "centered" ? "h-12 w-12" : "h-10 w-10"
          ].join(" ")}
        >
          <Loader2 className="animate-spin" size={layout === "centered" ? 24 : 20} aria-hidden="true" />
        </span>
        <div className={layout === "centered" ? "tm-mt-md" : ""}>
          <p className="tm-typo-body-emphasis">{title}</p>
          {description ? <p className="tm-mt-md tm-typo-body">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}
