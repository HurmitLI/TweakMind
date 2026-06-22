import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { OptimizationCapabilityRegistry } from "../core/execution/OptimizationCapabilityRegistry";
import { WindowsOptimizationService } from "../core/windows/WindowsOptimizationService";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function canRecover(entryId: string | undefined) {
  if (!entryId) {
    return undefined;
  }

  const entry = WindowsOptimizationService.getHistoryEntry(entryId);

  if (
    !entry ||
    !OptimizationCapabilityRegistry.canRecover(entry.optimizationId) ||
    entry.status !== "Success" ||
    entry.applyMode !== "real"
  ) {
    return undefined;
  }

  return entry;
}

export function RecoveryConfirmationPage() {
  const { historyId } = useParams();
  const entry = canRecover(historyId);

  if (!entry) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <section className="w-full max-w-3xl rounded-lg border border-amber-100 bg-white/90 p-8 text-center shadow-sm backdrop-blur">
          <h2 className="text-4xl font-semibold tracking-tight text-slate-950">Recovery Not Available</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Recovery is available only for successful Real Apply records with recovery support.
          </p>
          <Link
            className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            to="/history"
          >
            Open History
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Link className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700" to="/history">
        <ArrowLeft size={17} aria-hidden="true" />
        Cancel
      </Link>

      <section className="rounded-lg border border-white/70 bg-white/85 px-8 py-8 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Recovery Confirmation</p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">{entry.optimizationName}</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Review the saved previous state before restoring {entry.optimizationName}.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            <ShieldCheck size={16} aria-hidden="true" />
            Real Recovery
          </span>
        </div>
      </section>

      <dl className="grid gap-4 md:grid-cols-3">
        <Field label="Current state" value={entry.recoveryActualState ?? entry.newState} />
        <Field label="Previous saved state" value={entry.previousState} />
        <Field label="Expected restored state" value={entry.previousState} />
        <Field label="Recovery time" value="About 1 minute" />
        <Field label="Risk" value="Low" />
        <Field label="Startup configuration" value={entry.previousStartupType} />
      </dl>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">What will change</h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            TweakMind will ask the native recovery executor to restore {entry.optimizationName} to the saved previous state:
            {` ${entry.previousState}`}.
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Recovery Method</h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Recovery uses the History record created during Real Apply. The UI does not modify Windows directly.
          </p>
        </section>
      </div>

      <footer className="flex flex-col-reverse gap-3 rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          to="/history"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Cancel
        </Link>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          to={`/recovery?historyId=${entry.id}`}
        >
          Confirm Recovery
        </Link>
      </footer>
    </div>
  );
}
