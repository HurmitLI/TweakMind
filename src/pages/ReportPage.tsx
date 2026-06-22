import { Activity, AlertTriangle, Clock3, ListChecks } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { OptimizationCard } from "../components/report/OptimizationCard";
import { ReportActionPanel } from "../components/report/ReportActionPanel";
import { ReportMetric } from "../components/report/ReportMetric";
import { OptimizationRepository } from "../core/optimization/OptimizationRepository";
import {
  mockScanResult,
  RecommendationEngine,
  recommendationResultsStorageKey
} from "../core/recommendation/RecommendationEngine";
import { createRealScanResult } from "../core/recommendation/RealScanResult";
import type { RecommendationResult } from "../core/recommendation/RecommendationResult";
import type { OptimizationId } from "../types/optimization";

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

function isSelectableRecommendation(recommendation: RecommendationResult) {
  return recommendation.recommendation === "Recommended";
}

export function ReportPage() {
  const location = useLocation();
  const optimizations = useMemo(() => OptimizationRepository.getAll(), []);
  const initialRecommendationResults = useMemo(() => {
    const state = location.state as RecommendationLocationState | null;
    return state?.recommendationResults ?? readStoredRecommendationResults() ?? RecommendationEngine.generate(mockScanResult);
  }, [location.state]);
  const [recommendationResults, setRecommendationResults] = useState(initialRecommendationResults);

  useEffect(() => {
    setRecommendationResults(initialRecommendationResults);
  }, [initialRecommendationResults]);

  useEffect(() => {
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
  }, []);

  const recommendationsById = useMemo(
    () => new Map<OptimizationId, RecommendationResult>(recommendationResults.map((recommendation) => [recommendation.id, recommendation])),
    [recommendationResults]
  );
  const selectedOptimizations = recommendationResults.filter(isSelectableRecommendation);

  return (
    <div className="flex flex-1 flex-col">
      <section className="rounded-lg border border-white/70 bg-white/80 px-8 py-8 shadow-sm backdrop-blur">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Decision report</p>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-950">Optimization Report</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            We found several optimization opportunities based on your current configuration.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-4">
          <ReportMetric icon={ListChecks} label="Total recommendations" value={String(recommendationResults.length)} />
          <ReportMetric icon={Activity} label="Estimated total impact" value="Medium" />
          <ReportMetric icon={AlertTriangle} label="Estimated total risk" value="Low" />
          <ReportMetric icon={Clock3} label="Estimated execution time" value="3 min" />
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        {optimizations.map((optimization, index) => {
          const recommendation = recommendationsById.get(optimization.id);

          if (!recommendation) {
            return null;
          }

          return (
            <OptimizationCard
              defaultOpen={index === 0}
              key={optimization.id}
              optimization={optimization}
              recommendation={recommendation}
            />
          );
        })}
      </section>

      <ReportActionPanel selectedCount={selectedOptimizations.length} />
    </div>
  );
}
