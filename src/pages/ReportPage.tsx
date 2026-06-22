import { Activity, AlertTriangle, Clock3, ListChecks } from "lucide-react";
import { useMemo } from "react";
import { OptimizationCard } from "../components/report/OptimizationCard";
import { ReportActionPanel } from "../components/report/ReportActionPanel";
import { ReportMetric } from "../components/report/ReportMetric";
import { KnowledgeRepository, knowledgeToOptimizationDefinition } from "../core/knowledge/KnowledgeRepository";
import { readStoredScanResult, toRecommendationResult } from "../core/scan/ScanResult";

export function ReportPage() {
  const scanResult = useMemo(() => readStoredScanResult(), []);
  const optimizationResults = scanResult?.optimizationResults ?? [];

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
          <ReportMetric icon={ListChecks} label="Total recommendations" value={String(scanResult?.recommendationSummary.total ?? 0)} />
          <ReportMetric icon={Activity} label="Estimated total impact" value={scanResult?.estimatedImpact ?? "Medium"} />
          <ReportMetric icon={AlertTriangle} label="Estimated total risk" value={scanResult?.estimatedRisk ?? "Low"} />
          <ReportMetric icon={Clock3} label="Estimated execution time" value={scanResult?.executionEstimate ?? "3 min"} />
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        {optimizationResults.map((result, index) => (
          (() => {
            const knowledge = KnowledgeRepository.getById(result.id);
            const optimization = knowledge ? knowledgeToOptimizationDefinition(knowledge) : result.definition;

            return (
              <OptimizationCard
                defaultOpen={index === 0}
                key={result.id}
                optimization={optimization}
                recommendation={toRecommendationResult(result)}
              />
            );
          })()
        ))}
      </section>

      <ReportActionPanel selectedCount={scanResult?.recommendationSummary.selectedByDefault ?? 0} />
    </div>
  );
}
