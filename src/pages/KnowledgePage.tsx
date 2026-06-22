import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { KnowledgeRepository, estimateBenefitFromImpact } from "../core/knowledge/KnowledgeRepository";
import { readStoredScanResult } from "../core/scan/ScanResult";
import type { OptimizationCategory } from "../types/optimization";

const categoryFilters = ["Performance", "Gaming", "Privacy", "Security", "Windows"] as const;
type CategoryFilter = (typeof categoryFilters)[number];

function matchesCategory(category: CategoryFilter, knowledge: ReturnType<typeof KnowledgeRepository.getAll>[number]) {
  if (category === "Privacy") {
    return knowledge.impact.privacy > 0;
  }

  if (category === "Windows") {
    return true;
  }

  return knowledge.category === (category as OptimizationCategory);
}

function matchesSearch(query: string, knowledge: ReturnType<typeof KnowledgeRepository.getAll>[number]) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    knowledge.title,
    knowledge.category,
    knowledge.summary,
    knowledge.whatItDoes,
    knowledge.whyItMatters,
    knowledge.userDecisionNotes,
    knowledge.terminology.original,
    knowledge.terminology.localized,
    knowledge.terminology.tweakmind,
    knowledge.why,
    ...knowledge.benefits,
    ...knowledge.risks,
    ...knowledge.tradeOffs,
    ...knowledge.recommendedFor,
    ...knowledge.notRecommendedFor
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

export function KnowledgePage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter | null>(null);
  const knowledgeItems = useMemo(() => KnowledgeRepository.getAll(), []);
  const scanResult = useMemo(() => readStoredScanResult(), []);
  const statusById = useMemo(
    () => new Map(scanResult?.optimizationResults.map((result) => [result.id, result.normalizedStatus]) ?? []),
    [scanResult]
  );
  const visibleKnowledge = useMemo(
    () =>
      knowledgeItems.filter((knowledge) => {
        const categoryMatch = selectedCategory ? matchesCategory(selectedCategory, knowledge) : true;
        return categoryMatch && matchesSearch(query, knowledge);
      }),
    [knowledgeItems, query, selectedCategory]
  );

  return (
    <div className="flex flex-1 flex-col">
      <section className="rounded-lg border border-white/70 bg-white/80 px-8 py-8 shadow-sm backdrop-blur">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Knowledge base</p>
        <h2 className="text-4xl font-semibold tracking-tight text-slate-950">Optimization Knowledge</h2>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Browse supported Windows optimizations before making a decision.
        </p>

        <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block max-w-xl flex-1">
            <span className="sr-only">Search optimizations</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, keyword, or category"
              type="search"
              value={query}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {categoryFilters.map((category) => {
              const isSelected = selectedCategory === category;

              return (
                <button
                  className={[
                    "h-9 rounded-full border px-4 text-sm font-semibold transition",
                    isSelected
                      ? "border-blue-200 bg-blue-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
                  ].join(" ")}
                  key={category}
                  onClick={() => setSelectedCategory(isSelected ? null : category)}
                  type="button"
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        {visibleKnowledge.map((knowledge) => (
          <Link
            className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            key={knowledge.id}
            to={`/decision?id=${knowledge.id}`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold tracking-tight text-slate-950">{knowledge.title}</h3>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {knowledge.category}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Status: {statusById.get(knowledge.id) ?? "Not Available"}
                  </span>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{knowledge.summary}</p>
              </div>

              <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:w-56 lg:grid-cols-1">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{knowledge.risk.level}</p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated Benefit</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{estimateBenefitFromImpact(knowledge.impact.performance)}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
