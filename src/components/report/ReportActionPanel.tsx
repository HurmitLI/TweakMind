import { Link } from "react-router-dom";
import type { OptimizationId } from "../../types/optimization";
import { useTranslation } from "../../core/localization/LanguageProvider";

interface ReportActionPanelProps {
  selectedCount: number;
  confirmationOptimizationId?: OptimizationId;
}

export function ReportActionPanel({ confirmationOptimizationId, selectedCount }: ReportActionPanelProps) {
  const { t } = useTranslation();
  const canApply = selectedCount > 0 && confirmationOptimizationId !== undefined;

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{t("report.action.selectedOptimizations")}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{selectedCount}</p>
        </div>

        {canApply ? (
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            to={`/confirm/${confirmationOptimizationId}?from=report`}
          >
            {t("report.action.applySelected")}
          </Link>
        ) : (
          <button
            className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white opacity-60 shadow-sm"
            disabled
            type="button"
          >
            {t("report.action.applySelected")}
          </button>
        )}
      </div>
    </section>
  );
}
