import { AlertTriangle, ArrowLeft, History, RotateCcw, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { ErrorDescriptor } from "../../core/error/ErrorPresentationService";

export interface ErrorPresentationActions {
  onRetry?: () => void;
  onGoBack?: () => void;
  onDismiss?: () => void;
  goBackHref?: string;
  historyHref?: string;
  retryHref?: string;
}

interface ErrorPresentationProps {
  descriptor: ErrorDescriptor;
  actions?: ErrorPresentationActions;
  layout?: "inline" | "centered";
}

export function ErrorPresentation({ descriptor, actions = {}, layout = "inline" }: ErrorPresentationProps) {
  const {
    onRetry,
    onGoBack,
    onDismiss,
    goBackHref,
    historyHref = "/history",
    retryHref
  } = actions;

  const showRetry = descriptor.retryAvailable && (Boolean(onRetry) || Boolean(retryHref));
  const showGoBack = descriptor.showGoBack && (Boolean(onGoBack) || Boolean(goBackHref));
  const showOpenHistory = descriptor.showOpenHistory;
  const showDismiss = descriptor.showDismiss && Boolean(onDismiss);

  const containerClass =
    layout === "centered"
      ? "w-full max-w-3xl rounded-lg border border-rose-200 bg-white/95 p-8 text-center shadow-sm backdrop-blur"
      : "rounded-lg border border-rose-200 bg-rose-50 p-5 shadow-sm";

  return (
    <section aria-live="polite" className={containerClass} role="alert">
      <div className={layout === "centered" ? "mx-auto flex max-w-2xl flex-col items-center" : "flex flex-col gap-4"}>
        <div className={layout === "centered" ? "flex flex-col items-center" : "flex items-start gap-3"}>
          <span
            className={[
              "flex shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-100 text-rose-700",
              layout === "centered" ? "h-14 w-14" : "mt-0.5 h-10 w-10"
            ].join(" ")}
          >
            <AlertTriangle size={layout === "centered" ? 28 : 20} aria-hidden="true" />
          </span>
          <div className={layout === "centered" ? "mt-5 text-center" : "min-w-0 flex-1"}>
            <h3
              className={[
                "font-semibold tracking-tight text-slate-950",
                layout === "centered" ? "text-3xl" : "text-lg"
              ].join(" ")}
            >
              {descriptor.title}
            </h3>
            <p className={["leading-7 text-slate-600", layout === "centered" ? "mt-4 text-base" : "mt-2 text-sm"].join(" ")}>
              {descriptor.explanation}
            </p>
          </div>
        </div>

        {descriptor.possibleReasons && descriptor.possibleReasons.length > 0 ? (
          <div className={layout === "centered" ? "mt-2 w-full max-w-xl text-left" : ""}>
            <p className="text-sm font-semibold text-slate-700">Possible reasons</p>
            <ul className="mt-2 grid gap-2 text-sm leading-6 text-slate-600">
              {descriptor.possibleReasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className={["text-slate-700", layout === "centered" ? "mt-2 text-base leading-7" : "text-sm leading-6"].join(" ")}>
          <span className="font-semibold">Recommended action: </span>
          {descriptor.recommendedAction}
        </p>

        {showRetry || showGoBack || showOpenHistory || showDismiss ? (
          <div
            className={[
              "flex flex-col gap-3 sm:flex-row sm:flex-wrap",
              layout === "centered" ? "mt-8 justify-center" : "mt-1"
            ].join(" ")}
          >
            {showRetry ? (
              retryHref ? (
                <Link
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  to={retryHref}
                >
                  <RotateCcw size={17} aria-hidden="true" />
                  Retry
                </Link>
              ) : (
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  onClick={onRetry}
                  type="button"
                >
                  <RotateCcw size={17} aria-hidden="true" />
                  Retry
                </button>
              )
            ) : null}

            {showGoBack ? (
              goBackHref ? (
                <Link
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
                  to={goBackHref}
                >
                  <ArrowLeft size={17} aria-hidden="true" />
                  Go Back
                </Link>
              ) : (
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
                  onClick={onGoBack}
                  type="button"
                >
                  <ArrowLeft size={17} aria-hidden="true" />
                  Go Back
                </button>
              )
            ) : null}

            {showOpenHistory ? (
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
                to={historyHref}
              >
                <History size={17} aria-hidden="true" />
                Open History
              </Link>
            ) : null}

            {showDismiss ? (
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
                onClick={onDismiss}
                type="button"
              >
                <X size={17} aria-hidden="true" />
                Dismiss
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
