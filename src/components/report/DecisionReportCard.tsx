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
}

export function DecisionReportCard({ item, selected, onToggleSelected }: DecisionReportCardProps) {
  const { t } = useTranslation();

  return (
    <article className="tm-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <input
              aria-label={t("report.card.selectAriaLabel", { title: item.title })}
              checked={selected}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              onChange={() => onToggleSelected(item.id)}
              type="checkbox"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="tm-section-title">{item.title}</h3>
                <span
                  className={[
                    "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    recommendationStyles[item.recommendation]
                  ].join(" ")}
                >
                  {translateRecommendation(item.recommendation)}
                </span>
              </div>
              <p className="mt-2 tm-body">{item.reason}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{t("report.card.ifIgnoredPrefix")}</span> {item.ignoreConsequence}
              </p>
            </div>
          </div>
        </div>

        <Link
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          to={`/decision?id=${item.id}&from=report`}
        >
          {t("report.card.action.details")}
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("report.card.label.currentState")}</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{translateScanDisplayState(item.currentState)}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("report.card.label.risk")}</dt>
          <dd className="mt-1">
            <span className={["inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold", levelStyles[item.riskLevel]].join(" ")}>
              {translateRiskLevel(item.riskLevel)}
            </span>
          </dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("report.card.label.expectedBenefit")}</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{translateBenefitLevel(item.expectedBenefit)}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("report.card.label.lastApplied")}</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.lastAppliedLabel ?? t("common.value.never")}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("report.card.label.realApply")}</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.canRealApply ? t("common.value.yes") : t("common.value.no")}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("report.card.label.verification")}</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.canVerify ? t("common.value.yes") : t("common.value.no")}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("report.card.label.recovery")}</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{item.canRecover ? t("common.value.yes") : t("common.value.no")}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("report.card.label.runtimeScan")}</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{translateScanDisplayState(item.runtimeScanStatus)}</dd>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("report.card.label.detectionConfidence")}</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{translateConfidence(item.detectionConfidence)}</dd>
        </div>
      </dl>
    </article>
  );
}
