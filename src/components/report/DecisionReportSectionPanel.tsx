import type { ReactNode } from "react";
import { DecisionReportCard } from "./DecisionReportCard";
import type { DecisionReportItem, DecisionReportSection, DecisionReportSectionId } from "../../core/report/DecisionReportTypes";
import { useTranslation } from "../../core/localization/LanguageProvider";

interface DecisionReportSectionPanelProps {
  section: DecisionReportSection;
  selectedIds: string[];
  onToggleSelected: (id: DecisionReportItem["id"]) => void;
  emptyState?: ReactNode;
}

function sectionPanelClass(sectionId: DecisionReportSectionId) {
  if (sectionId === "recommended") {
    return "tm-report-section-recommended";
  }

  if (sectionId === "keep-current" || sectionId === "unavailable") {
    return "tm-report-section-quiet";
  }

  return "border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/95";
}

function sectionTitleClass(sectionId: DecisionReportSectionId) {
  if (sectionId === "recommended") {
    return "text-lg font-semibold tracking-tight text-emerald-900 dark:text-emerald-100";
  }

  if (sectionId === "keep-current" || sectionId === "unavailable") {
    return "text-base font-semibold tracking-tight text-slate-600 dark:text-slate-400";
  }

  return "tm-section-title";
}

export function DecisionReportSectionPanel({
  section,
  selectedIds,
  onToggleSelected,
  emptyState
}: DecisionReportSectionPanelProps) {
  const { t } = useTranslation();
  const isQuiet = section.id === "keep-current" || section.id === "unavailable";

  return (
    <details
      className={[
        "group rounded-lg border shadow-sm",
        sectionPanelClass(section.id)
      ].join(" ")}
      open={section.id === "recommended"}
    >
      <summary className="cursor-pointer list-none px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className={sectionTitleClass(section.id)}>{section.title}</h3>
            <p className={["mt-1", isQuiet ? "tm-body-compact text-slate-500 dark:text-slate-500" : "tm-body"].join(" ")}>
              {section.description}
            </p>
          </div>
          <span
            className={[
              "rounded-full border px-3 py-1 text-xs font-semibold",
              section.id === "recommended"
                ? "border-emerald-200 bg-white text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            ].join(" ")}
          >
            {section.items.length}
          </span>
        </div>
      </summary>

      <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800">
        {section.items.length === 0
          ? emptyState ?? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {t("report.sectionPanel.emptyDefault")}
              </p>
            )
          : section.items.map((item) => (
              <DecisionReportCard
                emphasis={section.id === "recommended" ? "strong" : isQuiet ? "quiet" : "default"}
                item={item}
                key={item.id}
                onToggleSelected={onToggleSelected}
                selected={selectedIds.includes(item.id)}
              />
            ))}
      </div>
    </details>
  );
}
