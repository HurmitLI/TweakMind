import { useMemo, useState } from "react";
import { EmptyState } from "../components/common/EmptyState";
import { DecisionReportSectionPanel } from "../components/report/DecisionReportSectionPanel";
import { ReportFilters } from "../components/report/ReportFilters";
import { ReportSelectionPanel } from "../components/report/ReportSelectionPanel";
import { useTranslation } from "../core/localization/LanguageProvider";
import {
  translateReportStoredExecutionTime,
  translateReportStoredImpact,
  translateReportStoredRisk
} from "../core/localization/localizationHelpers";
import { DecisionReportService } from "../core/report/DecisionReportService";
import type { DecisionReportFilterId, DecisionReportSectionId } from "../core/report/DecisionReportTypes";
import { readStoredScanResult } from "../core/scan/ScanResult";
import type { OptimizationCategory, OptimizationId, OptimizationRiskLevel } from "../types/optimization";

export function ReportPage() {
  const { t, language } = useTranslation();
  const scanResult = useMemo(() => readStoredScanResult(), []);
  const reportModel = useMemo(() => DecisionReportService.buildModel(scanResult, language), [scanResult, language]);
  const [activeFilter, setActiveFilter] = useState<DecisionReportFilterId>("all");
  const [activeRisk, setActiveRisk] = useState<OptimizationRiskLevel | undefined>();
  const [activeCategory, setActiveCategory] = useState<OptimizationCategory | undefined>();
  const [selectedIds, setSelectedIds] = useState<OptimizationId[]>(() =>
    reportModel.allItems.filter((item) => item.selectable && scanResult?.optimizationResults.some((result) => result.id === item.id && result.selectedByDefault)).map((item) => item.id)
  );

  function sectionEmptyState(sectionId: DecisionReportSectionId) {
    const messageKey = {
      recommended: "report.sectionEmpty.recommended",
      optional: "report.sectionEmpty.optional",
      "keep-current": "report.sectionEmpty.keepCurrent",
      unavailable: "report.sectionEmpty.unavailable"
    }[sectionId] as "report.sectionEmpty.recommended";

    return (
      <p className="py-5 tm-typo-body-secondary">
        {t(messageKey)}
      </p>
    );
  }

  const filteredItems = useMemo(
    () => DecisionReportService.filterItems(reportModel.allItems, activeFilter, activeRisk, activeCategory),
    [activeFilter, activeCategory, activeRisk, reportModel.allItems]
  );

  const filteredSections = useMemo(
    () =>
      reportModel.sections.map((section) => ({
        ...section,
        items: section.items.filter((item) => filteredItems.some((filtered) => filtered.id === item.id))
      })),
    [filteredItems, reportModel.sections]
  );

  const selectionSummary = useMemo(
    () => DecisionReportService.summarizeSelection(selectedIds, reportModel.allItems, language),
    [reportModel.allItems, selectedIds, language]
  );

  function toggleSelected(id: OptimizationId) {
    if (!reportModel.allItems.some((item) => item.id === id && item.selectable)) {
      return;
    }

    setSelectedIds((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]));
  }

  if (!reportModel.hasScan) {
    return (
      <div className="tm-layout-page">
        <section className="tm-card-hero">
          <p className="tm-eyebrow">{t("report.eyebrow")}</p>
          <h2 className="tm-typo-page">{t("report.title")}</h2>
        </section>
        <EmptyState
          actionLabel={t("report.empty.noScan.action")}
          actionTo="/scan"
          description={t("report.empty.noScan.description")}
          title={t("report.empty.noScan.title")}
          variant="comfortable"
        />
      </div>
    );
  }

  const hasVisibleItems = filteredItems.length > 0;

  return (
    <div className="tm-layout-page">
      <section className="tm-card-hero">
        <div className="max-w-3xl">
          <p className="tm-eyebrow">{t("report.eyebrow")}</p>
          <h2 className="tm-typo-page">{t("report.title")}</h2>
          <p className="tm-subtitle">{t("report.subtitle")}</p>
        </div>

        <div className="tm-report-metrics">
          <span className="tm-report-metric-inline">
            {t("report.metric.totalRecommendations")}:
            <span className="tm-report-metric-value">{scanResult?.recommendationSummary.total ?? 0}</span>
          </span>
          <span className="tm-report-metric-inline">
            {t("report.metric.estimatedTotalImpact")}:
            <span className="tm-report-metric-value">{translateReportStoredImpact(scanResult?.estimatedImpact)}</span>
          </span>
          <span className="tm-report-metric-inline">
            {t("report.metric.estimatedTotalRisk")}:
            <span className="tm-report-metric-value">{translateReportStoredRisk(scanResult?.estimatedRisk)}</span>
          </span>
          <span className="tm-report-metric-inline">
            {t("report.metric.estimatedExecutionTime")}:
            <span className="tm-report-metric-value">{translateReportStoredExecutionTime(scanResult?.executionEstimate)}</span>
          </span>
        </div>
      </section>

      <div>
        <ReportFilters
          activeCategory={activeCategory}
          activeFilter={activeFilter}
          activeRisk={activeRisk}
          onCategoryChange={setActiveCategory}
          onFilterChange={(filter) => {
            setActiveFilter(filter);
            if (filter !== "risk") {
              setActiveRisk(undefined);
            }
            if (filter !== "category") {
              setActiveCategory(undefined);
            }
          }}
          onRiskChange={setActiveRisk}
        />
      </div>

      {!hasVisibleItems ? (
        <EmptyState
          actionLabel={t("report.empty.noMatch.action")}
          actionTo="/scan"
          description={t("report.empty.noMatch.description")}
          title={t("report.empty.noMatch.title")}
        />
      ) : (
        <section className="tm-layout-stack">
          {filteredSections.map((section) => (
            <DecisionReportSectionPanel
              emptyState={sectionEmptyState(section.id)}
              key={section.id}
              onToggleSelected={toggleSelected}
              section={section}
              selectedIds={selectedIds}
            />
          ))}
        </section>
      )}

      <ReportSelectionPanel summary={selectionSummary} />
    </div>
  );
}
