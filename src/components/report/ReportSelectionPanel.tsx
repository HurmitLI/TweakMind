import { Link } from "react-router-dom";
import type { DecisionReportSelectionSummary } from "../../core/report/DecisionReportTypes";
import { useTranslation } from "../../core/localization/LanguageProvider";
import { translateRiskLevel } from "../../core/localization/localizationHelpers";

interface ReportSelectionPanelProps {
  summary: DecisionReportSelectionSummary;
}

function formatHighestRisk(value: DecisionReportSelectionSummary["highestSelectedRisk"], t: ReturnType<typeof useTranslation>["t"]) {
  if (value === "None") {
    return t("report.selection.highestRisk.none");
  }

  if (value === "Low" || value === "Medium" || value === "High" || value === "Unknown") {
    return translateRiskLevel(value);
  }

  return value;
}

export function ReportSelectionPanel({ summary }: ReportSelectionPanelProps) {
  const { t } = useTranslation();
  const canApply = summary.applyState === "ready" && summary.applyTargetId;

  return (
    <section className="rounded-lg border border-blue-100 bg-white/95 p-5 shadow-md shadow-blue-100/40 dark:border-blue-500/30 dark:bg-slate-900/95 dark:shadow-blue-950/10">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="tm-mini-card">
          <p className="tm-label">{t("report.selection.label.selected")}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{summary.selectedCount}</p>
        </div>
        <div className="tm-mini-card">
          <p className="tm-label">{t("report.selection.label.estimatedExecutionTime")}</p>
          <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{summary.estimatedExecutionTime}</p>
        </div>
        <div className="tm-mini-card">
          <p className="tm-label">{t("report.selection.label.highestSelectedRisk")}</p>
          <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{formatHighestRisk(summary.highestSelectedRisk, t)}</p>
        </div>
        <div className="tm-mini-card">
          <p className="tm-label">{t("report.selection.label.applyStatus")}</p>
          <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{summary.applyMessage}</p>
        </div>
      </div>

      <div className="mt-5 flex justify-end border-t border-slate-100 pt-5 dark:border-slate-800">
        {canApply ? (
          <Link
            className="tm-button-primary"
            to={`/confirm/${summary.applyTargetId}?from=report`}
          >
            {t("report.selection.action.applySelected")}
          </Link>
        ) : (
          <button
            className="tm-button-disabled"
            disabled
            type="button"
          >
            {t("report.selection.action.applySelected")}
          </button>
        )}
      </div>
    </section>
  );
}
