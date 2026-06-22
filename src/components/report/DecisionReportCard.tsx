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
import type { OptimizationRecommendation, OptimizationRiskLevel } from "../../types/optimization";

const recommendationStyles: Record<OptimizationRecommendation, string> = {
  Recommended: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Keep Default": "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  "Keep Enabled": "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-300",
  "Already Optimized": "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300",
  Optional: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300"
};

const levelStyles: Record<OptimizationRiskLevel | "Unknown", string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300",
  Medium: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300",
  High: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-300",
  Unknown: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
};

interface DecisionReportCardProps {
  item: DecisionReportItem;
  selected: boolean;
  onToggleSelected: (id: DecisionReportItem["id"]) => void;
  emphasis?: "strong" | "default" | "quiet";
}

export function DecisionReportCard({ item, selected, onToggleSelected, emphasis = "default" }: DecisionReportCardProps) {
  const { t } = useTranslation();
  const isQuiet = emphasis === "quiet";

  return (
    <article
      className={[
        "rounded-lg border p-5 transition",
        emphasis === "strong"
          ? "border-emerald-200 bg-white shadow-sm dark:border-emerald-500/30 dark:bg-slate-900/95"
          : isQuiet
            ? "border-slate-200/80 bg-slate-50/60 dark:border-slate-700/80 dark:bg-slate-900/80"
            : "border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/95"
      ].join(" ")}
    >
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
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={emphasis === "strong" ? "text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100" : "tm-section-title"}>
                  {item.title}
                </h3>
                <span
                  className={[
                    "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    recommendationStyles[item.recommendation]
                  ].join(" ")}
                >
                  {translateRecommendation(item.recommendation)}
                </span>
              </div>
              <p className={["mt-2", isQuiet ? "tm-body-compact text-slate-500" : "tm-body"].join(" ")}>{item.reason}</p>
              {!isQuiet ? (
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{t("report.card.ifIgnoredPrefix")}</span> {item.ignoreConsequence}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <Link
          className={[
            "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-4 text-sm font-semibold shadow-sm transition",
            isQuiet
              ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          ].join(" ")}
          to={`/decision?id=${item.id}&from=report`}
        >
          {t("report.card.action.details")}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
        <div className="tm-report-metric-inline">
          <dt className="text-slate-500 dark:text-slate-400">{t("report.card.label.currentState")}</dt>
          <dd className="tm-report-metric-value">{translateScanDisplayState(item.currentState)}</dd>
        </div>
        <div className="tm-report-metric-inline">
          <dt className="text-slate-500 dark:text-slate-400">{t("report.card.label.risk")}</dt>
          <dd>
            <span className={["inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold", levelStyles[item.riskLevel]].join(" ")}>
              {translateRiskLevel(item.riskLevel)}
            </span>
          </dd>
        </div>
        <div className="tm-report-metric-inline">
          <dt className="text-slate-500 dark:text-slate-400">{t("report.card.label.expectedBenefit")}</dt>
          <dd className="tm-report-metric-value">{translateBenefitLevel(item.expectedBenefit)}</dd>
        </div>
        <div className="tm-report-metric-inline">
          <dt className="text-slate-500 dark:text-slate-400">{t("report.card.label.realApply")}</dt>
          <dd className="tm-report-metric-value">{item.canRealApply ? t("common.value.yes") : t("common.value.no")}</dd>
        </div>
        <div className="tm-report-metric-inline">
          <dt className="text-slate-500 dark:text-slate-400">{t("report.card.label.recovery")}</dt>
          <dd className="tm-report-metric-value">{item.canRecover ? t("common.value.yes") : t("common.value.no")}</dd>
        </div>
        <div className="tm-report-metric-inline">
          <dt className="text-slate-500 dark:text-slate-400">{t("report.card.label.detectionConfidence")}</dt>
          <dd className="tm-report-metric-value">{translateConfidence(item.detectionConfidence)}</dd>
        </div>
      </dl>
    </article>
  );
}
