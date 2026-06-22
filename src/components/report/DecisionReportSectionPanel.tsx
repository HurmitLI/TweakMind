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

  if (sectionId === "optional") {
    return "tm-report-section-optional";
  }

  if (sectionId === "keep-current") {
    return "tm-report-section-passive";
  }

  if (sectionId === "unavailable") {
    return "tm-report-section-quiet";
  }

  return "tm-report-section-optional";
}

function sectionTitleClass(sectionId: DecisionReportSectionId) {
  if (sectionId === "recommended") {
    return "tm-typo-section";
  }

  if (sectionId === "optional") {
    return "tm-typo-body-emphasis";
  }

  if (sectionId === "keep-current") {
    return "tm-typo-body-emphasis";
  }

  if (sectionId === "unavailable") {
    return "tm-typo-caption";
  }

  return "tm-typo-section";
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

  return (
    <details
      className={sectionPanelClass(section.id)}
      open={section.id === "recommended"}
    >
      <summary className="cursor-pointer list-none px-6 py-6">
        <div className="flex items-center justify-between tm-gap-md">
          <div>
            <h3 className={sectionTitleClass(section.id)}>{section.title}</h3>
            <p
              className={[
                "tm-mt-sm",
                isQuiet ? "tm-typo-caption" : "tm-typo-body-secondary"
              ].join(" ")}
            >
              {section.description}
            </p>
          </div>
          <span
            className={[
              "tm-typo-caption tabular-nums",
              section.id === "recommended" ? "tm-status-badge tm-status-badge-success" : "tm-status-badge"
            ].join(" ")}
          >
            {section.items.length}
          </span>
        </div>
      </summary>

      <div className="divide-y divide-[color:var(--tm-color-divider)] px-6 pb-3">
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
