import type { ReactNode } from "react";
import { DecisionReportCard } from "./DecisionReportCard";
import type { DecisionReportItem, DecisionReportSection } from "../../core/report/DecisionReportTypes";

interface DecisionReportSectionPanelProps {
  section: DecisionReportSection;
  selectedIds: string[];
  onToggleSelected: (id: DecisionReportItem["id"]) => void;
  emptyState?: ReactNode;
}

export function DecisionReportSectionPanel({
  section,
  selectedIds,
  onToggleSelected,
  emptyState
}: DecisionReportSectionPanelProps) {
  return (
    <details className="group rounded-lg border border-slate-200 bg-white/90 shadow-sm" open={section.id === "recommended"}>
      <summary className="cursor-pointer list-none px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{section.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{section.description}</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {section.items.length}
          </span>
        </div>
      </summary>

      <div className="space-y-4 border-t border-slate-100 px-5 pb-5 pt-4">
        {section.items.length === 0
          ? emptyState ?? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No optimizations in this section for the current scan and filters.
              </p>
            )
          : section.items.map((item) => (
              <DecisionReportCard
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
