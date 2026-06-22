import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { DecisionReportItem } from "../../core/report/DecisionReportTypes";
import { useTranslation } from "../../core/localization/LanguageProvider";
import {
  translateBenefitLevel,
  translateConfidence,
  translateRecommendation,
  translateRiskLevel,
  translateScanDisplayState
} from "../../core/localization/localizationHelpers";
import type { OptimizationRecommendation } from "../../types/optimization";

const recommendationStyles: Record<OptimizationRecommendation, string> = {
  Recommended: "text-emerald-700 dark:text-emerald-300",
  "Keep Default": "text-slate-500 dark:text-slate-400",
  "Keep Enabled": "text-blue-700 dark:text-blue-300",
  "Already Optimized": "text-emerald-700 dark:text-emerald-300",
  Optional: "text-amber-700 dark:text-amber-300"
};

interface DecisionReportCardProps {
  item: DecisionReportItem;
  selected: boolean;
  onToggleSelected: (id: DecisionReportItem["id"]) => void;
  emphasis?: "strong" | "default" | "passive" | "quiet";
}

function itemClass(emphasis: DecisionReportCardProps["emphasis"]) {
  if (emphasis === "strong") {
    return "tm-report-item-strong";
  }

  if (emphasis === "passive") {
    return "tm-report-item-passive";
  }

  if (emphasis === "quiet") {
    return "tm-report-item-quiet";
  }

  return "tm-report-item-passive";
}

export function DecisionReportCard({ item, selected, onToggleSelected, emphasis = "default" }: DecisionReportCardProps) {
  const { t } = useTranslation();
  const isQuiet = emphasis === "quiet";

  return (
    <article className={itemClass(emphasis)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <input
              aria-label={t("report.card.selectAriaLabel", { title: item.title })}
              checked={selected}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
              onChange={() => onToggleSelected(item.id)}
              type="checkbox"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h3
                  className={
                    emphasis === "strong"
                      ? "tm-typo-body-emphasis"
                      : isQuiet
                        ? "tm-typo-caption"
                        : "tm-typo-body-emphasis"
                  }
                >
                  {item.title}
                </h3>
                <span className={["tm-typo-caption font-medium", recommendationStyles[item.recommendation]].join(" ")}>
                  {translateRecommendation(item.recommendation)}
                </span>
              </div>
              <p className={["mt-2", isQuiet ? "tm-typo-caption" : "tm-typo-body-secondary"].join(" ")}>
                {item.reason}
              </p>
              {emphasis === "strong" ? (
                <p className="tm-mt-md tm-typo-body-secondary">
                  <span className="tm-typo-body-emphasis">{t("report.card.ifIgnoredPrefix")}</span> {item.ignoreConsequence}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {!isQuiet ? (
          <Link className="tm-button-ghost shrink-0" to={`/decision?id=${item.id}&from=report`}>
            {t("report.card.action.details")}
            <ChevronRight size={15} aria-hidden="true" />
          </Link>
        ) : (
          <Link className="tm-button-ghost shrink-0 tm-typo-caption" to={`/decision?id=${item.id}&from=report`}>
            {t("report.card.action.details")}
            <ChevronRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>

      {!isQuiet ? (
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 pl-7 text-sm">
          <div className="tm-report-metric-inline">
            <dt>{t("report.card.label.currentState")}</dt>
            <dd className="tm-report-metric-value">{translateScanDisplayState(item.currentState)}</dd>
          </div>
          <div className="tm-report-metric-inline">
            <dt>{t("report.card.label.risk")}</dt>
            <dd className="tm-report-metric-value">{translateRiskLevel(item.riskLevel)}</dd>
          </div>
          <div className="tm-report-metric-inline">
            <dt>{t("report.card.label.expectedBenefit")}</dt>
            <dd className="tm-report-metric-value">{translateBenefitLevel(item.expectedBenefit)}</dd>
          </div>
          {emphasis === "strong" ? (
            <>
              <div className="tm-report-metric-inline">
                <dt>{t("report.card.label.realApply")}</dt>
                <dd className="tm-report-metric-value">{item.canRealApply ? t("common.value.yes") : t("common.value.no")}</dd>
              </div>
              <div className="tm-report-metric-inline">
                <dt>{t("report.card.label.recovery")}</dt>
                <dd className="tm-report-metric-value">{item.canRecover ? t("common.value.yes") : t("common.value.no")}</dd>
              </div>
              <div className="tm-report-metric-inline">
                <dt>{t("report.card.label.detectionConfidence")}</dt>
                <dd className="tm-report-metric-value">{translateConfidence(item.detectionConfidence)}</dd>
              </div>
            </>
          ) : null}
        </dl>
      ) : null}
    </article>
  );
}
