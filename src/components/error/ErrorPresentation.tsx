import { AlertTriangle, ArrowLeft, History, RotateCcw, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { ErrorDescriptor } from "../../core/error/ErrorPresentationService";
import { useTranslation } from "../../core/localization/LanguageProvider";

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
  const { t } = useTranslation();
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

  const containerClass = [
    "tm-error-state",
    layout === "centered" ? "tm-error-state-centered" : ""
  ].join(" ");

  return (
    <section aria-live="polite" className={containerClass} role="alert">
      <div className={layout === "centered" ? "mx-auto flex max-w-2xl flex-col items-center" : "tm-layout-section"}>
        <div className={layout === "centered" ? "flex flex-col items-center" : "flex items-start tm-gap-sm"}>
          <span
            className={[
              "tm-error-state-icon",
              layout === "centered" ? "h-14 w-14" : "mt-0.5 h-10 w-10"
            ].join(" ")}
          >
            <AlertTriangle size={layout === "centered" ? 28 : 20} aria-hidden="true" />
          </span>
          <div className={layout === "centered" ? "tm-mt-lg text-center" : "min-w-0 flex-1"}>
            <h3 className={layout === "centered" ? "tm-typo-page" : "tm-typo-section"}>{descriptor.title}</h3>
            <p className={layout === "centered" ? "tm-mt-md tm-typo-body" : "tm-mt-md tm-typo-body-secondary"}>
              {descriptor.explanation}
            </p>
          </div>
        </div>

        {descriptor.possibleReasons && descriptor.possibleReasons.length > 0 ? (
          <div className={layout === "centered" ? "tm-mt-md w-full max-w-xl text-left" : ""}>
            <p className="tm-typo-body-emphasis">{t("error.possibleReasons.title")}</p>
            <ul className="tm-mt-md tm-layout-stack-sm tm-typo-body">
              {descriptor.possibleReasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className={layout === "centered" ? "tm-mt-md tm-typo-body" : "tm-typo-body-secondary"}>
          <span className="tm-typo-body-emphasis">{t("error.recommendedActionPrefix")} </span>
          {descriptor.recommendedAction}
        </p>

        {showRetry || showGoBack || showOpenHistory || showDismiss ? (
          <div
            className={[
              "flex flex-col tm-gap-sm sm:flex-row sm:flex-wrap",
              layout === "centered" ? "tm-mt-lg justify-center" : "tm-mt-md"
            ].join(" ")}
          >
            {showRetry ? (
              retryHref ? (
                <Link className="tm-button-primary" to={retryHref}>
                  <RotateCcw size={17} aria-hidden="true" />
                  {t("common.action.retry")}
                </Link>
              ) : (
                <button className="tm-button-primary" onClick={onRetry} type="button">
                  <RotateCcw size={17} aria-hidden="true" />
                  {t("common.action.retry")}
                </button>
              )
            ) : null}

            {showGoBack ? (
              goBackHref ? (
                <Link className="tm-button-secondary" to={goBackHref}>
                  <ArrowLeft size={17} aria-hidden="true" />
                  {t("common.action.goBack")}
                </Link>
              ) : (
                <button className="tm-button-secondary" onClick={onGoBack} type="button">
                  <ArrowLeft size={17} aria-hidden="true" />
                  {t("common.action.goBack")}
                </button>
              )
            ) : null}

            {showOpenHistory ? (
              <Link className="tm-button-secondary" to={historyHref}>
                <History size={17} aria-hidden="true" />
                {t("common.action.openHistory")}
              </Link>
            ) : null}

            {showDismiss ? (
              <button className="tm-button-secondary" onClick={onDismiss} type="button">
                <X size={17} aria-hidden="true" />
                {t("common.action.dismiss")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
