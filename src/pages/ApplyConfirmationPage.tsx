import { ArrowLeft, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RecommendationBadge } from "../components/decision/RecommendationBadge";
import { KnowledgeRepository, knowledgeToOptimizationDefinition } from "../core/knowledge/KnowledgeRepository";
import { OptimizationRepository } from "../core/optimization/OptimizationRepository";
import { readStoredScanResult, toRecommendationResult } from "../core/scan/ScanResult";
import type { OptimizationId, OptimizationRecommendation, OptimizationStatus } from "../types/optimization";

const riskStyles = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-rose-200 bg-rose-50 text-rose-700"
};

function targetStateFor(id: OptimizationId, recommendation: OptimizationRecommendation, currentStatus: OptimizationStatus) {
  if (recommendation === "Already Optimized" || recommendation === "Keep Default" || recommendation === "Keep Enabled") {
    return currentStatus;
  }

  const targetStates: Record<OptimizationId, string> = {
    "windows-search": "Disabled",
    "game-mode": "Enabled",
    "core-isolation": "Enabled",
    "delivery-optimization": "Default"
  };

  return targetStates[id];
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
        {items.map((item) => (
          <li className="flex gap-3" key={item}>
            <CheckCircle2 className="mt-0.5 shrink-0 text-blue-700" size={17} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ApplyConfirmationPage() {
  const navigate = useNavigate();
  const { optimizationId } = useParams();
  const [searchParams] = useSearchParams();
  const scanResult = useMemo(() => readStoredScanResult(), []);
  const defaultOptimization = OptimizationRepository.getDefault();
  const requestedOptimizationId = (optimizationId as OptimizationId | undefined) ?? defaultOptimization.id;
  const optimizationResult = scanResult?.optimizationResults.find((result) => result.id === requestedOptimizationId);
  const knowledge = KnowledgeRepository.getById(requestedOptimizationId);
  const optimization =
    (knowledge ? knowledgeToOptimizationDefinition(knowledge) : undefined) ??
    optimizationResult?.definition ??
    OptimizationRepository.getById(requestedOptimizationId) ??
    defaultOptimization;
  const recommendation = optimizationResult
    ? toRecommendationResult(optimizationResult)
    : {
        id: optimization.id,
        recommendation: optimization.recommendation,
        reason: optimization.description,
        currentStatus: optimization.status,
        selectable: false,
        selectedByDefault: false
      };
  const currentStatus = recommendation.currentStatus ?? "Unknown";
  const targetState = targetStateFor(optimization.id, recommendation.recommendation, currentStatus);
  const source = searchParams.get("from") === "decision" ? "decision" : "report";
  const cancelTarget = source === "decision" ? `/decision?id=${optimization.id}` : "/report";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <button
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
            return;
          }

          navigate(cancelTarget);
        }}
        type="button"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Cancel
      </button>

      <section className="rounded-lg border border-white/70 bg-white/85 px-8 py-8 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Review before applying</p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">{optimization.title}</h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{recommendation.reason}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <RecommendationBadge value={recommendation.recommendation} />
            <span className={["inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold", riskStyles[optimization.risk.level]].join(" ")}>
              Risk: {optimization.risk.level}
            </span>
          </div>
        </div>
      </section>

      <dl className="grid gap-4 md:grid-cols-4">
        <Field label="Current detected status" value={currentStatus} />
        <Field label="Target state" value={targetState} />
        <Field label="Recovery time" value={knowledge?.recovery.estimatedTime ?? optimization.estimatedTime} />
        <Field label="Action type" value="Mock only" />
      </dl>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">What will change</h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">{knowledge?.why ?? optimization.description}</p>
          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
              <p>This confirmation records a mock apply result. It does not write to Windows settings or the Registry.</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Why this is {recommendation.recommendation.toLowerCase()}</h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">{recommendation.reason}</p>
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            <ShieldCheck className="mt-0.5 shrink-0 text-slate-700" size={18} aria-hidden="true" />
            <p>{knowledge?.riskAnalysis ?? optimization.risk.reason}</p>
          </div>
        </section>

        <ListSection title="Trade-offs" items={knowledge?.tradeOffs ?? optimization.tradeOffs} />

        <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">Recovery method</h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">{knowledge?.recovery.method ?? optimization.recovery}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">Estimated recovery time</dt>
              <dd className="mt-1 text-slate-950">{knowledge?.recovery.estimatedTime ?? optimization.estimatedTime}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Expected result</dt>
              <dd className="mt-1 text-slate-950">{knowledge?.recovery.expectedResult ?? optimization.expectedResult}</dd>
            </div>
          </dl>
        </section>
      </div>

      <footer className="flex flex-col-reverse gap-3 rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          to={cancelTarget}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Cancel
        </Link>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          to={`/apply?id=${optimization.id}`}
        >
          Confirm and Apply
        </Link>
      </footer>
    </div>
  );
}
