import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "../core/localization/LanguageProvider";
import { OnboardingService } from "../core/onboarding/OnboardingService";

const workflowStepKeys = [
  { titleKey: "onboarding.workflow.knowledge.title", sentenceKey: "onboarding.workflow.knowledge.sentence" },
  { titleKey: "onboarding.workflow.scan.title", sentenceKey: "onboarding.workflow.scan.sentence" },
  { titleKey: "onboarding.workflow.decision.title", sentenceKey: "onboarding.workflow.decision.sentence" },
  { titleKey: "onboarding.workflow.apply.title", sentenceKey: "onboarding.workflow.apply.sentence" },
  { titleKey: "onboarding.workflow.verify.title", sentenceKey: "onboarding.workflow.verify.sentence" },
  { titleKey: "onboarding.workflow.recover.title", sentenceKey: "onboarding.workflow.recover.sentence" }
] as const;

const stepTitleKeys = [
  "onboarding.step.welcome",
  "onboarding.step.whatIsTweakMind",
  "onboarding.step.workflow",
  "onboarding.step.startFirstScan"
] as const;

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const workflowSteps = useMemo(
    () => workflowStepKeys.map((step) => ({ title: t(step.titleKey), sentence: t(step.sentenceKey) })),
    [t]
  );

  function finish(destination: "/scan" | "/knowledge" | "/dashboard") {
    OnboardingService.markComplete();
    navigate(destination, { replace: true });
  }

  return (
    <div className="tm-onboarding-shell">
      <div className="tm-onboarding-card">
        <p className="tm-eyebrow">{t("onboarding.stepIndicator", { current: stepIndex + 1, total: stepTitleKeys.length })}</p>
        <h1 className="tm-mt-md tm-typo-section">{t(stepTitleKeys[stepIndex])}</h1>

        {stepIndex === 0 ? (
          <div className="tm-mt-lg tm-layout-stack tm-typo-body">
            <p>{t("onboarding.welcome.intro")}</p>
            <p className="tm-typo-body-emphasis">{t("onboarding.welcome.question")}</p>
            <p>{t("onboarding.welcome.answer")}</p>
          </div>
        ) : null}

        {stepIndex === 1 ? (
          <div className="tm-mt-lg tm-layout-stack tm-typo-body">
            <p>{t("onboarding.whatIs.paragraph1")}</p>
            <p>{t("onboarding.whatIs.paragraph2")}</p>
          </div>
        ) : null}

        {stepIndex === 2 ? (
          <ol className="tm-mt-lg tm-step-list">
            {workflowSteps.map((step, index) => (
              <li className="tm-onboarding-step" key={workflowStepKeys[index].titleKey}>
                <div className="flex items-start tm-gap-sm">
                  <span className="tm-step-marker tm-step-marker-active">{index + 1}</span>
                  <div>
                    <p className="tm-typo-body-emphasis">{step.title}</p>
                    <p className="tm-mt-md tm-typo-body">{step.sentence}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {stepIndex === 3 ? (
          <div className="tm-mt-lg tm-layout-stack tm-typo-body">
            <p>{t("onboarding.final.intro")}</p>
            <div className="flex flex-col tm-gap-sm pt-2 sm:flex-row">
              <button className="tm-button-primary" onClick={() => finish("/scan")} type="button">
                {t("onboarding.action.startScan")}
              </button>
              <button className="tm-button-secondary" onClick={() => finish("/knowledge")} type="button">
                {t("onboarding.action.exploreKnowledge")}
              </button>
            </div>
            <button className="tm-button-ghost" onClick={() => finish("/dashboard")} type="button">
              {t("onboarding.action.skip")}
            </button>
          </div>
        ) : null}

        {stepIndex < 3 ? (
          <div className="tm-mt-lg flex items-center justify-between tm-gap-md">
            <button className="tm-button-ghost" onClick={() => finish("/dashboard")} type="button">
              {t("onboarding.action.skip")}
            </button>
            <button className="tm-button-primary" onClick={() => setStepIndex((current) => current + 1)} type="button">
              {t("onboarding.action.continue")}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <p className="tm-mt-lg tm-typo-caption">
            {t("onboarding.final.dashboardPrompt")}{" "}
            <Link className="tm-link-accent" to="/dashboard" onClick={() => OnboardingService.markComplete()}>
              {t("onboarding.final.goToDashboard")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
