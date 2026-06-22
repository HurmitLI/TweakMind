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
    <section className="tm-panel">
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{t("report.selection.label.selected")}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{summary.selectedCount}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{t("report.selection.label.estimatedExecutionTime")}</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{summary.estimatedExecutionTime}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{t("report.selection.label.highestSelectedRisk")}</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{formatHighestRisk(summary.highestSelectedRisk, t)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{t("report.selection.label.applyStatus")}</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">{summary.applyMessage}</p>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
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
