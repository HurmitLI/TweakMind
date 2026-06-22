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

  if (sectionId === "keep-current") {
    return "tm-report-section-passive";
  }

  if (sectionId === "unavailable") {
    return "tm-report-section-quiet";
  }

  return "rounded-xl bg-white/80 dark:bg-slate-900/80";
}

function sectionTitleClass(sectionId: DecisionReportSectionId) {
  if (sectionId === "recommended") {
    return "text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100";
  }

  if (sectionId === "keep-current") {
    return "text-base font-medium tracking-tight text-slate-600 dark:text-slate-400";
  }

  if (sectionId === "unavailable") {
    return "text-sm font-medium tracking-tight text-slate-500 dark:text-slate-500";
  }

  return "tm-section-title";
}

function cardEmphasis(sectionId: DecisionReportSectionId): "strong" | "default" | "passive" | "quiet" {
  if (sectionId === "recommended") {
    return "strong";
  }

  if (sectionId === "keep-current") {
    return "passive";
  }

  if (sectionId === "unavailable") {
    return "quiet";
  }

  return "default";
}

export function DecisionReportSectionPanel({
  section,
  selectedIds,
  onToggleSelected,
  emptyState
}: DecisionReportSectionPanelProps) {
  const { t } = useTranslation();
  const isQuiet = section.id === "unavailable";
  const isPassive = section.id === "keep-current";

  return (
    <details
      className={sectionPanelClass(section.id)}
      open={section.id === "recommended"}
    >
      <summary className="cursor-pointer list-none px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className={sectionTitleClass(section.id)}>{section.title}</h3>
            <p
              className={[
                "mt-1.5",
                isQuiet ? "text-sm leading-6 text-slate-400" : isPassive ? "tm-body-secondary" : "tm-body-secondary"
              ].join(" ")}
            >
              {section.description}
            </p>
          </div>
          <span
            className={[
              "text-xs font-medium tabular-nums",
              section.id === "recommended" ? "text-emerald-700 dark:text-emerald-300" : "text-slate-400 dark:text-slate-500"
            ].join(" ")}
          >
            {section.items.length}
          </span>
        </div>
      </summary>

      <div className="divide-y divide-slate-100 px-6 pb-2 dark:divide-slate-800/80">
        {section.items.length === 0
          ? emptyState ?? (
              <p className="py-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t("report.sectionPanel.emptyDefault")}
              </p>
            )
          : section.items.map((item) => (
              <DecisionReportCard
                emphasis={cardEmphasis(section.id)}
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
