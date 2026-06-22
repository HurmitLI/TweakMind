import { useMemo, useState } from "react";
import { EmptyState } from "../components/common/EmptyState";
import { DecisionReportSectionPanel } from "../components/report/DecisionReportSectionPanel";
import { ReportFilters } from "../components/report/ReportFilters";
import { ReportSelectionPanel } from "../components/report/ReportSelectionPanel";
import { useTranslation } from "../core/localization/LanguageProvider";
import { DecisionReportService } from "../core/report/DecisionReportService";
import type { DecisionReportFilterId, DecisionReportSectionId } from "../core/report/DecisionReportTypes";
import { readStoredScanResult } from "../core/scan/ScanResult";
import type { OptimizationCategory, OptimizationId, OptimizationRiskLevel } from "../types/optimization";

export function ReportPage() {
  const { t } = useTranslation();
  const scanResult = useMemo(() => readStoredScanResult(), []);
  const reportModel = useMemo(() => DecisionReportService.buildModel(scanResult), [scanResult]);
  const [activeFilter, setActiveFilter] = useState<DecisionReportFilterId>("all");
  const [activeRisk, setActiveRisk] = useState<OptimizationRiskLevel | undefined>();
  const [activeCategory, setActiveCategory] = useState<OptimizationCategory | undefined>();
  const [selectedIds, setSelectedIds] = useState<OptimizationId[]>(() =>
    scanResult?.optimizationResults.filter((result) => result.selectedByDefault).map((result) => result.id) ?? []
  );

  function sectionEmptyState(sectionId: DecisionReportSectionId) {
    const messageKey = {
      recommended: "report.sectionEmpty.recommended",
      optional: "report.sectionEmpty.optional",
      "keep-current": "report.sectionEmpty.keepCurrent",
      unavailable: "report.sectionEmpty.unavailable"
    }[sectionId] as "report.sectionEmpty.recommended";

    return (
      <p className="py-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
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
    () => DecisionReportService.summarizeSelection(selectedIds, reportModel.allItems),
    [reportModel.allItems, selectedIds]
  );

  function toggleSelected(id: OptimizationId) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]));
  }

  if (!reportModel.hasScan) {
    return (
      <div className="tm-page">
        <section className="tm-hero">
          <p className="tm-eyebrow">{t("report.eyebrow")}</p>
          <h2 className="tm-title">{t("report.title")}</h2>
        </section>
        <EmptyState
          actionLabel={t("report.empty.noScan.action")}
          actionTo="/scan"
          description={t("report.empty.noScan.description")}
          title={t("report.empty.noScan.title")}
        />
      </div>
    );
  }

  const hasVisibleItems = filteredItems.length > 0;

  return (
    <div className="tm-page">
      <section className="tm-hero">
        <div className="max-w-3xl">
          <p className="tm-eyebrow">{t("report.eyebrow")}</p>
          <h2 className="tm-title">{t("report.title")}</h2>
          <p className="tm-subtitle">{t("report.subtitle")}</p>
        </div>

        <div className="tm-report-metrics">
          <span className="tm-report-metric-inline">
            {t("report.metric.totalRecommendations")}:
            <span className="tm-report-metric-value">{scanResult?.recommendationSummary.total ?? 0}</span>
          </span>
          <span className="tm-report-metric-inline">
            {t("report.metric.estimatedTotalImpact")}:
            <span className="tm-report-metric-value">{scanResult?.estimatedImpact ?? t("report.metric.defaultImpact")}</span>
          </span>
          <span className="tm-report-metric-inline">
            {t("report.metric.estimatedTotalRisk")}:
            <span className="tm-report-metric-value">{scanResult?.estimatedRisk ?? t("report.metric.defaultRisk")}</span>
          </span>
          <span className="tm-report-metric-inline">
            {t("report.metric.estimatedExecutionTime")}:
            <span className="tm-report-metric-value">{scanResult?.executionEstimate ?? t("report.metric.defaultExecutionTime")}</span>
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
        <section className="grid gap-5">
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
