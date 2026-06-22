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
    <section className="tm-report-selection-panel">
      <div className="tm-form-grid md:grid-cols-4">
        <div className="tm-card-metadata">
          <p className="tm-label">{t("report.selection.label.selected")}</p>
          <p className="tm-mt-sm tm-report-selection-summary">{summary.selectedCount}</p>
        </div>
        <div className="tm-card-metadata">
          <p className="tm-label">{t("report.selection.label.estimatedExecutionTime")}</p>
          <p className="tm-mt-sm tm-value">{summary.estimatedExecutionTime}</p>
        </div>
        <div className="tm-card-metadata">
          <p className="tm-label">{t("report.selection.label.highestSelectedRisk")}</p>
          <p className="tm-mt-sm tm-value">{formatHighestRisk(summary.highestSelectedRisk, t)}</p>
        </div>
        <div className="tm-card-metadata">
          <p className="tm-label">{t("report.selection.label.applyStatus")}</p>
          <p className="tm-mt-sm tm-value">{summary.applyMessage}</p>
        </div>
      </div>

      <div className="tm-mt-lg flex justify-end border-t border-[color:var(--tm-color-divider)] pt-5">
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
