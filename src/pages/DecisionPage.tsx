import { ArrowLeft, Check, X } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BulletListSection } from "../components/decision/BulletListSection";
import { DecisionSection } from "../components/decision/DecisionSection";
import { RecommendationBadge } from "../components/decision/RecommendationBadge";
import { RecoveryPanel } from "../components/decision/RecoveryPanel";
import { formatImpactLevel } from "../core/knowledge/knowledgeSchemaHelpers";
import { KnowledgeRepository, knowledgeToOptimizationDefinition } from "../core/knowledge/KnowledgeRepository";
import { OptimizationRepository } from "../core/optimization/OptimizationRepository";
import { readStoredScanResult, toRecommendationResult } from "../core/scan/ScanResult";
import type { OptimizationId } from "../types/optimization";

const riskStyles = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-rose-200 bg-rose-50 text-rose-700",
  Unknown: "border-slate-200 bg-slate-50 text-slate-700"
};

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

function ImpactGrid({ knowledge }: { knowledge: NonNullable<ReturnType<typeof KnowledgeRepository.getById>> }) {
  const items = [
    ["Performance", knowledge.benefits.performanceImpact],
    ["Memory", knowledge.benefits.memoryImpact],
    ["Battery", knowledge.benefits.batteryImpact],
    ["Latency", knowledge.benefits.latencyImpact],
    ["Network", knowledge.benefits.networkImpact],
    ["Privacy", knowledge.benefits.privacyImpact]
  ] as const;

  return (
    <DecisionSection title="Benefit Impact Areas">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(([label, level]) => (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3" key={label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{formatImpactLevel(level)}</p>
          </div>
        ))}
      </div>
    </DecisionSection>
  );
}

export function DecisionPage() {
  const [searchParams] = useSearchParams();
  const scanResult = useMemo(() => readStoredScanResult(), []);
  const defaultOptimization = OptimizationRepository.getDefault();
  const requestedOptimizationId = (searchParams.get("id") as OptimizationId | null) ?? defaultOptimization.id;
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
        currentStatus: "Unknown" as const,
        selectable: false,
        selectedByDefault: false
      };
  const currentStatus = recommendation?.currentStatus ?? "Unknown";
  const displayRiskLevel = knowledge?.risks.riskLevel ?? optimization.risk.level;

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
              <span
                className={[
                  "rounded-full border px-3 py-1 text-sm font-semibold",
                  riskStyles[displayRiskLevel === "Unknown" ? "Unknown" : displayRiskLevel]
                ].join(" ")}
              >
                Risk: {displayRiskLevel}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                Category: {optimization.category}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                Current Status: {currentStatus}
              </span>
              {knowledge ? (
                <>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    Priority: {knowledge.identity.priority}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    Scan: {knowledge.currentStatus.scanAvailability}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {knowledge ? (
        <>
          <DecisionSection title="Overview">
            <p className="text-base leading-7 text-slate-700">{knowledge.overview.summary}</p>
            <p className="mt-4 text-base leading-7 text-slate-700">{knowledge.overview.purpose}</p>
          </DecisionSection>

          <div className="grid gap-6 xl:grid-cols-2">
            <DecisionSection title="How Windows Works">
              <p>{knowledge.overview.howWindowsWorks}</p>
            </DecisionSection>
            <DecisionSection title="Why It Exists">
              <p>{knowledge.overview.whyItExists}</p>
            </DecisionSection>
          </div>

          <DecisionSection title="Current Status">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supported Windows</dt>
                <dd className="mt-1 text-sm text-slate-800">{knowledge.currentStatus.supportedWindows}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Default Value</dt>
                <dd className="mt-1 text-sm text-slate-800">{knowledge.currentStatus.defaultValue}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scan Availability</dt>
                <dd className="mt-1 text-sm text-slate-800">{knowledge.currentStatus.scanAvailability}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Difficulty</dt>
                <dd className="mt-1 text-sm text-slate-800">{knowledge.identity.difficulty}</dd>
              </div>
            </dl>
          </DecisionSection>

          <ImpactGrid knowledge={knowledge} />

          <div className="grid gap-6 xl:grid-cols-2">
            <ChecklistSection title="Pros" items={knowledge.tradeOffs.pros} variant="positive" />
            <BulletListSection title="Cons" items={knowledge.tradeOffs.cons} />
            <ChecklistSection title="Who should enable this?" items={knowledge.recommendation.recommendedFor} variant="positive" />
            <ChecklistSection title="Who should NOT enable this?" items={knowledge.recommendation.notRecommendedFor} variant="negative" />
          </div>

          <BulletListSection title="Typical Scenarios" items={knowledge.recommendation.typicalScenarios} />
          <BulletListSection title="Possible Side Effects" items={knowledge.tradeOffs.possibleSideEffects} />
          <ChecklistSection title="When Not To Use" items={knowledge.risks.whenNotToUse} variant="negative" />

          <DecisionSection title={`Risk Analysis: ${displayRiskLevel}`}>
            <p>{knowledge.risks.riskExplanation}</p>
          </DecisionSection>

          <DecisionSection title="Decision Support">
            <dl className="grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expected Benefit</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-950">{knowledge.decisionSupport.expectedBenefit}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-950">{knowledge.decisionSupport.confidence}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recovery Difficulty</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-950">{knowledge.recovery.recoveryDifficulty}</dd>
              </div>
            </dl>
            <p className="mt-4 text-base leading-7 text-slate-700">{knowledge.decisionSupport.decisionNotes}</p>
          </DecisionSection>

          <DecisionSection title="Terminology">
            <dl className="grid gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Original</dt>
                <dd className="mt-1 whitespace-pre-line text-sm text-slate-800">{knowledge.terminology.original}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Localized</dt>
                <dd className="mt-1 whitespace-pre-line text-sm text-slate-800">{knowledge.terminology.localized}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">TweakMind</dt>
                <dd className="mt-1 whitespace-pre-line text-sm text-slate-800">{knowledge.terminology.tweakmind}</dd>
              </div>
            </dl>
          </DecisionSection>

          {knowledge.learning.commonMisconceptions.length > 0 ? (
            <BulletListSection title="Common Misconceptions" items={knowledge.learning.commonMisconceptions} />
          ) : null}

          {knowledge.learning.relatedOptimizations.length > 0 ? (
            <DecisionSection title="Related Optimizations">
              <p className="text-sm text-slate-700">{knowledge.learning.relatedOptimizations.join(", ")}</p>
            </DecisionSection>
          ) : null}
        </>
      ) : (
        <>
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
        </>
      )}

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
          to={`/confirm/${optimization.id}?from=decision`}
        >
          Apply This Optimization
        </Link>
      </footer>
    </div>
  );
}
