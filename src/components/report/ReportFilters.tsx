import type { DecisionReportFilterId } from "../../core/report/DecisionReportTypes";
import { useTranslation } from "../../core/localization/LanguageProvider";
import { translateCategory, translateRiskLevel } from "../../core/localization/localizationHelpers";
import type { OptimizationCategory, OptimizationRiskLevel } from "../../types/optimization";
import type { TranslationKey } from "../../core/localization/messages";

const filterOptions: Array<{ id: DecisionReportFilterId; labelKey: TranslationKey }> = [
  { id: "all", labelKey: "report.filter.all" },
  { id: "real-apply", labelKey: "report.filter.realApply" },
  { id: "knowledge-only", labelKey: "report.filter.knowledgeOnly" },
  { id: "risk", labelKey: "report.filter.risk" },
  { id: "category", labelKey: "report.filter.category" }
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
  const { t } = useTranslation();

  return (
    <section className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const isActive = activeFilter === option.id;

          return (
            <button
              className={[
                "h-9 tm-chip",
                isActive ? "tm-chip-active" : ""
              ].join(" ")}
              key={option.id}
              onClick={() => onFilterChange(option.id)}
              type="button"
            >
              {t(option.labelKey)}
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
              {translateRiskLevel(risk)}
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
              {translateCategory(category)}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
