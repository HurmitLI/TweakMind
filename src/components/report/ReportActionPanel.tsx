interface ReportActionPanelProps {
  selectedCount: number;
}

export function ReportActionPanel({ selectedCount }: ReportActionPanelProps) {
  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Selected Optimizations</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{selectedCount}</p>
        </div>

        <button
          className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white opacity-60 shadow-sm"
          disabled
          type="button"
        >
          Apply Selected
        </button>
      </div>
    </section>
  );
}
