import { Activity, AlertTriangle, Clock3, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DecisionReportSectionPanel } from "../components/report/DecisionReportSectionPanel";
import { ReportFilters } from "../components/report/ReportFilters";
import { ReportMetric } from "../components/report/ReportMetric";
import { ReportSelectionPanel } from "../components/report/ReportSelectionPanel";
import { DecisionReportService } from "../core/report/DecisionReportService";
import type { DecisionReportFilterId, DecisionReportSectionId } from "../core/report/DecisionReportTypes";
import { readStoredScanResult } from "../core/scan/ScanResult";
import type { OptimizationCategory, OptimizationId, OptimizationRiskLevel } from "../types/optimization";

function sectionEmptyState(sectionId: DecisionReportSectionId) {
  switch (sectionId) {
    case "recommended":
      return (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Nothing is strongly recommended right now. Review optional items or run a new scan after changing your setup.
        </p>
      );
    case "optional":
      return (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No optional recommendations matched your filters.
        </p>
      );
    case "keep-current":
      return (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No keep-current items matched your filters. This usually means nothing scanned as already aligned with defaults.
        </p>
      );
    case "unavailable":
      return (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No unavailable items matched your filters.
        </p>
      );
  }
}

export function ReportPage() {
  const scanResult = useMemo(() => readStoredScanResult(), []);
  const reportModel = useMemo(() => DecisionReportService.buildModel(scanResult), [scanResult]);
  const [activeFilter, setActiveFilter] = useState<DecisionReportFilterId>("all");
  const [activeRisk, setActiveRisk] = useState<OptimizationRiskLevel | undefined>();
  const [activeCategory, setActiveCategory] = useState<OptimizationCategory | undefined>();
  const [selectedIds, setSelectedIds] = useState<OptimizationId[]>(() =>
    scanResult?.optimizationResults.filter((result) => result.selectedByDefault).map((result) => result.id) ?? []
  );

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
      <div className="flex flex-1 flex-col">
        <section className="rounded-lg border border-white/70 bg-white/80 px-8 py-8 shadow-sm backdrop-blur">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Decision workspace</p>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-950">Decision Report</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Run a scan first so TweakMind can compare recommendations and current states before you decide what to apply.
          </p>
          <Link
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            to="/scan"
          >
            Go to Scan
          </Link>
        </section>
      </div>
    );
  }

  const hasVisibleItems = filteredItems.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <section className="rounded-lg border border-white/70 bg-white/80 px-8 py-8 shadow-sm backdrop-blur">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Decision workspace</p>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-950">Decision Report</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Compare what deserves attention, what is safe to apply, and what is unavailable before you choose your next step.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-4">
          <ReportMetric icon={ListChecks} label="Total recommendations" value={String(scanResult?.recommendationSummary.total ?? 0)} />
          <ReportMetric icon={Activity} label="Estimated total impact" value={scanResult?.estimatedImpact ?? "Medium"} />
          <ReportMetric icon={AlertTriangle} label="Estimated total risk" value={scanResult?.estimatedRisk ?? "Low"} />
          <ReportMetric icon={Clock3} label="Estimated execution time" value={scanResult?.executionEstimate ?? "3 min"} />
        </div>
      </section>

      <div className="mt-6">
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
        <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          No optimizations matched the current filters. Try another filter or run a new scan if your system state changed.
        </section>
      ) : (
        <section className="mt-6 grid gap-4">
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
