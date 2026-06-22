import { ArrowLeft, Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { BulletListSection } from "../components/decision/BulletListSection";
import { DecisionSection } from "../components/decision/DecisionSection";
import { RecommendationBadge } from "../components/decision/RecommendationBadge";
import { RecoveryPanel } from "../components/decision/RecoveryPanel";
import { OptimizationRepository } from "../core/optimization/OptimizationRepository";
import {
  mockScanResult,
  RecommendationEngine,
  recommendationResultsStorageKey
} from "../core/recommendation/RecommendationEngine";
import { createRealScanResult } from "../core/recommendation/RealScanResult";
import type { RecommendationResult } from "../core/recommendation/RecommendationResult";
import type { OptimizationId } from "../types/optimization";

const riskStyles = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-rose-200 bg-rose-50 text-rose-700"
};

interface RecommendationLocationState {
  recommendationResults?: RecommendationResult[];
}

function readStoredRecommendationResults(): RecommendationResult[] | null {
  try {
    const stored = window.sessionStorage.getItem(recommendationResultsStorageKey);
    return stored ? (JSON.parse(stored) as RecommendationResult[]) : null;
  } catch {
    return null;
  }
}

function ChecklistSection({ title, items, variant }: { title: string; items: string[]; variant: "positive" | "negative" }) {
  const isPositive = variant === "positive";
  const Icon = isPositive ? Check : X;

  return (
    <DecisionSection title={title}>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li className="flex items-start gap-3" key={item}>
            <span
              className={[
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                isPositive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              ].join(" ")}
            >
              <Icon size={14} aria-hidden="true" />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </DecisionSection>
  );
}

export function DecisionPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const defaultOptimization = OptimizationRepository.getDefault();
  const requestedOptimizationId = (searchParams.get("id") as OptimizationId | null) ?? defaultOptimization.id;
  const optimization =
    OptimizationRepository.getById(requestedOptimizationId) ?? defaultOptimization;
  const initialRecommendationResults = useMemo(() => {
    const state = location.state as RecommendationLocationState | null;
    return state?.recommendationResults ?? readStoredRecommendationResults() ?? RecommendationEngine.generate(mockScanResult);
  }, [location.state]);
  const [recommendationResults, setRecommendationResults] = useState(initialRecommendationResults);

  useEffect(() => {
    setRecommendationResults(initialRecommendationResults);
  }, [initialRecommendationResults]);

  useEffect(() => {
    if (optimization.id !== "windows-search" && optimization.id !== "game-mode" && optimization.id !== "core-isolation") {
      return;
    }

    let isMounted = true;

    async function refreshRecommendationResults() {
      const scanResult = await createRealScanResult();
      const nextResults = RecommendationEngine.generate(scanResult);

      if (!isMounted) {
        return;
      }

      setRecommendationResults(nextResults);
      window.sessionStorage.setItem(recommendationResultsStorageKey, JSON.stringify(nextResults));
    }

    void refreshRecommendationResults();

    return () => {
      isMounted = false;
    };
  }, [optimization.id]);

  const recommendation =
    recommendationResults.find((candidate) => candidate.id === optimization.id) ??
    RecommendationEngine.generate(mockScanResult).find((candidate) => candidate.id === optimization.id);
  const currentStatus = recommendation?.currentStatus ?? "Unknown";

  if (!recommendation) {
    throw new Error(`Missing recommendation result for ${optimization.id}`);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Link
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        to="/report"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Back to Report
      </Link>

      <section className="rounded-lg border border-white/70 bg-white/85 px-8 py-8 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Expert recommendation</p>
            <h2 className="text-5xl font-semibold tracking-tight text-slate-950">{optimization.title}</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <RecommendationBadge value={recommendation.recommendation} />
              <span className={["rounded-full border px-3 py-1 text-sm font-semibold", riskStyles[optimization.risk.level]].join(" ")}>
                Risk: {optimization.risk.level}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                Category: {optimization.category}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                Current Status: {currentStatus}
              </span>
            </div>
          </div>
        </div>
      </section>

      <DecisionSection title="Why this optimization?">
        <p className="text-base leading-7 text-slate-700">{optimization.description}</p>
      </DecisionSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChecklistSection title="Benefits" items={optimization.benefits} variant="positive" />
        <BulletListSection title="Trade-offs" items={optimization.tradeOffs} />
        <ChecklistSection title="Who should enable this?" items={optimization.recommendedFor} variant="positive" />
        <ChecklistSection title="Who should NOT enable this?" items={optimization.notRecommendedFor} variant="negative" />
      </div>

      <DecisionSection title={`Risk Analysis: ${optimization.risk.level}`}>
        <p>{optimization.risk.reason}</p>
      </DecisionSection>

      <RecoveryPanel
        difficulty={optimization.difficulty}
        expectedResult={optimization.expectedResult}
        method={optimization.recovery}
        time={optimization.estimatedTime}
      />

      <footer className="flex flex-col-reverse gap-3 rounded-lg border border-slate-200 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          to="/report"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back
        </Link>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          to={`/apply?id=${optimization.id}`}
        >
          Apply This Optimization
        </Link>
      </footer>
    </div>
  );
}
