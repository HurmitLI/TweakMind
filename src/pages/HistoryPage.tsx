import { useState } from "react";
import { Link } from "react-router-dom";
import { getApplyModeLabelForMode } from "../components/apply/ApplyModeBadge";
import { OptimizationCapabilityRegistry } from "../core/execution/OptimizationCapabilityRegistry";
import { RuntimeScanService } from "../core/scan/RuntimeScanService";
import {
  type OptimizationHistoryEntry,
  type OptimizationRecoveryStatus,
  WindowsOptimizationService
} from "../core/windows/WindowsOptimizationService";
import type { VerificationStatus } from "../core/verification/VerificationResult";

const verificationStyles: Record<VerificationStatus, string> = {
  Verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Failed: "border-rose-200 bg-rose-50 text-rose-700",
  "Pending / Not Available": "border-amber-200 bg-amber-50 text-amber-700"
};

const recoveryStyles: Record<OptimizationRecoveryStatus, string> = {
  "Not Started": "border-slate-200 bg-slate-100 text-slate-700",
  Started: "border-blue-200 bg-blue-50 text-blue-700",
  Success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Failed: "border-rose-200 bg-rose-50 text-rose-700"
};

function canRecover(entry: OptimizationHistoryEntry) {
  const capabilities = OptimizationCapabilityRegistry.get(entry.optimizationId);

  return (
    capabilities.canRecover &&
    entry.status === "Success" &&
    entry.applyMode === "real" &&
    entry.recoveryStatus !== "Success"
  );
}

export function HistoryPage() {
  const [history] = useState<OptimizationHistoryEntry[]>(() => WindowsOptimizationService.getHistory());

  return (
    <div className="flex flex-1 flex-col">
      <section className="rounded-lg border border-white/70 bg-white/80 px-8 py-8 shadow-sm backdrop-blur">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Recovery</p>
        <h2 className="text-4xl font-semibold tracking-tight text-slate-950">History</h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Review previous optimizations and restore them if necessary.
        </p>
      </section>

      <section className="mt-6 grid gap-4">
        {history.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white/90 p-6 text-sm text-slate-600 shadow-sm">
            No optimizations have been applied yet.
          </div>
        ) : (
          history.map((entry) => (
            <article className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm" key={entry.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold text-slate-950">{entry.optimizationName}</h3>
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {entry.status}
                    </span>
                    <span
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        verificationStyles[entry.verificationStatus ?? "Pending / Not Available"]
                      ].join(" ")}
                    >
                      Verification: {entry.verificationStatus ?? "Pending / Not Available"}
                    </span>
                    <span
                      className={[
                        "rounded-full border px-3 py-1 text-xs font-semibold",
                        recoveryStyles[entry.recoveryStatus ?? "Not Started"]
                      ].join(" ")}
                    >
                      Recovery: {entry.recoveryStatus ?? "Not Started"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{entry.recoveryMessage ?? entry.message}</p>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-6">
                    <div>
                      <dt className="font-semibold text-slate-500">Apply mode</dt>
                      <dd className="mt-1 text-slate-950">
                        {entry.applyMode ? getApplyModeLabelForMode(entry.applyMode) : "Unknown"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Previous state</dt>
                      <dd className="mt-1 text-slate-950">{entry.previousState}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">New state</dt>
                      <dd className="mt-1 text-slate-950">{entry.newState}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Verified actual</dt>
                      <dd className="mt-1 text-slate-950">{entry.verificationActualState ?? "Unknown"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Recovery actual</dt>
                      <dd className="mt-1 text-slate-950">{entry.recoveryActualState ?? "Unknown"}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Timestamp</dt>
                      <dd className="mt-1 text-slate-950">{new Date(Number(entry.timestamp) * 1000).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Runtime scan</dt>
                      <dd className="mt-1 text-slate-950">
                        {RuntimeScanService.getStoredSnapshot(entry.optimizationId)?.runtimeScanStatus ??
                          RuntimeScanService.getCapability(entry.optimizationId).scanCapability}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500">Scan state</dt>
                      <dd className="mt-1 text-slate-950">{RuntimeScanService.getDisplayState(entry.optimizationId)}</dd>
                    </div>
                  </dl>
                </div>

                {canRecover(entry) ? (
                  <Link
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    to={`/recover/${entry.id}`}
                  >
                    Restore
                  </Link>
                ) : (
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled
                    type="button"
                  >
                    {entry.recoveryStatus === "Success" ? "Recovered" : "Recovery Unavailable"}
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
