import type { DecisionReportFilterId } from "../../core/report/DecisionReportTypes";
import type { OptimizationCategory, OptimizationRiskLevel } from "../../types/optimization";

const filterOptions: Array<{ id: DecisionReportFilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "real-apply", label: "Real Apply" },
  { id: "knowledge-only", label: "Knowledge Only" },
  { id: "risk", label: "Risk" },
  { id: "category", label: "Category" }
];

const riskOptions: OptimizationRiskLevel[] = ["High", "Medium", "Low"];
const categoryOptions: OptimizationCategory[] = ["Performance", "Gaming", "Security", "Network", "Privacy", "Windows"];

interface ReportFiltersProps {
  activeFilter: DecisionReportFilterId;
  activeRisk?: OptimizationRiskLevel;
  activeCategory?: OptimizationCategory;
  onFilterChange: (filter: DecisionReportFilterId) => void;
  onRiskChange: (risk?: OptimizationRiskLevel) => void;
  onCategoryChange: (category?: OptimizationCategory) => void;
}

export function ReportFilters({
  activeFilter,
  activeRisk,
  activeCategory,
  onFilterChange,
  onRiskChange,
  onCategoryChange
}: ReportFiltersProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const isActive = activeFilter === option.id;

          return (
            <button
              className={[
                "h-9 rounded-full border px-4 text-sm font-semibold transition",
                isActive
                  ? "border-blue-200 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
              ].join(" ")}
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {activeFilter === "risk" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {riskOptions.map((risk) => (
            <button
              className={[
                "h-8 rounded-full border px-3 text-xs font-semibold transition",
                activeRisk === risk
                  ? "border-amber-200 bg-amber-100 text-amber-800"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              ].join(" ")}
              key={risk}
              onClick={() => onRiskChange(activeRisk === risk ? undefined : risk)}
              type="button"
            >
              {risk}
            </button>
          ))}
        </div>
      ) : null}

      {activeFilter === "category" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {categoryOptions.map((category) => (
            <button
              className={[
                "h-8 rounded-full border px-3 text-xs font-semibold transition",
                activeCategory === category
                  ? "border-blue-200 bg-blue-100 text-blue-800"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              ].join(" ")}
              key={category}
              onClick={() => onCategoryChange(activeCategory === category ? undefined : category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
