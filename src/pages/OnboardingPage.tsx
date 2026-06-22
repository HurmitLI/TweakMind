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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-slate-100">
      <div className="w-full max-w-2xl rounded-lg border border-slate-800 bg-slate-900/95 p-8 shadow-2xl backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
          {t("onboarding.stepIndicator", { current: stepIndex + 1, total: stepTitleKeys.length })}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{t(stepTitleKeys[stepIndex])}</h1>

        {stepIndex === 0 ? (
          <div className="mt-6 space-y-4 text-base leading-7 text-slate-300">
            <p>{t("onboarding.welcome.intro")}</p>
            <p className="font-medium text-slate-100">{t("onboarding.welcome.question")}</p>
            <p>{t("onboarding.welcome.answer")}</p>
          </div>
        ) : null}

        {stepIndex === 1 ? (
          <div className="mt-6 space-y-4 text-base leading-7 text-slate-300">
            <p>{t("onboarding.whatIs.paragraph1")}</p>
            <p>{t("onboarding.whatIs.paragraph2")}</p>
          </div>
        ) : null}

        {stepIndex === 2 ? (
          <ol className="mt-6 grid gap-3">
            {workflowSteps.map((step, index) => (
              <li className="rounded-lg border border-slate-800 bg-slate-950/70 p-4" key={workflowStepKeys[index].titleKey}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{step.sentence}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {stepIndex === 3 ? (
          <div className="mt-6 space-y-4 text-base leading-7 text-slate-300">
            <p>{t("onboarding.final.intro")}</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                onClick={() => finish("/scan")}
                type="button"
              >
                {t("onboarding.action.startScan")}
              </button>
              <button
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                onClick={() => finish("/knowledge")}
                type="button"
              >
                {t("onboarding.action.exploreKnowledge")}
              </button>
            </div>
            <button
              className="text-sm font-semibold text-slate-400 transition hover:text-slate-200"
              onClick={() => finish("/dashboard")}
              type="button"
            >
              {t("onboarding.action.skip")}
            </button>
          </div>
        ) : null}

        {stepIndex < 3 ? (
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              className="text-sm font-semibold text-slate-400 transition hover:text-slate-200"
              onClick={() => finish("/dashboard")}
              type="button"
            >
              {t("onboarding.action.skip")}
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
              onClick={() => setStepIndex((current) => current + 1)}
              type="button"
            >
              {t("onboarding.action.continue")}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <p className="mt-8 text-sm text-slate-500">
            {t("onboarding.final.dashboardPrompt")}{" "}
            <Link className="font-semibold text-slate-300 hover:text-white" to="/dashboard" onClick={() => OnboardingService.markComplete()}>
              {t("onboarding.final.goToDashboard")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
