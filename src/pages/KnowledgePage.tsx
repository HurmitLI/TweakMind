import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { KnowledgeRepository } from "../core/knowledge/KnowledgeRepository";
import { hasPrivacyRelevance } from "../core/knowledge/knowledgeSchemaHelpers";
import { useTranslation } from "../core/localization/LanguageProvider";
import {
  translateBenefitLevel,
  translateCategory,
  translatePriority,
  translateRiskLevel,
  translateScanCapability,
  translateScanDisplayState
} from "../core/localization/localizationHelpers";
import { RuntimeScanService } from "../core/scan/RuntimeScanService";
import { useSettings } from "../core/settings/SettingsProvider";
import { SettingsService } from "../core/settings/SettingsService";
import type { OptimizationCategory } from "../types/optimization";

const categoryFilters = ["Performance", "Gaming", "Privacy", "Security", "Windows"] as const;
type CategoryFilter = (typeof categoryFilters)[number];

const categoryFilterKeys: Record<CategoryFilter, "knowledge.filter.performance" | "knowledge.filter.gaming" | "knowledge.filter.privacy" | "knowledge.filter.security" | "knowledge.filter.windows"> = {
  Performance: "knowledge.filter.performance",
  Gaming: "knowledge.filter.gaming",
  Privacy: "knowledge.filter.privacy",
  Security: "knowledge.filter.security",
  Windows: "knowledge.filter.windows"
};

function matchesCategory(category: CategoryFilter, knowledge: ReturnType<typeof KnowledgeRepository.getAll>[number]) {
  if (category === "Privacy") {
    return hasPrivacyRelevance(knowledge.benefits);
  }

  if (category === "Windows") {
    return true;
  }

  return knowledge.identity.category === (category as OptimizationCategory);
}

function matchesSearch(
  query: string,
  knowledge: ReturnType<typeof KnowledgeRepository.getAll>[number],
  terminologyMode: ReturnType<typeof SettingsService.getSettings>["terminologyMode"]
) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const displayTitle = SettingsService.resolveKnowledgeTitle(knowledge, terminologyMode);

  const searchableText = [
    displayTitle,
    knowledge.identity.title,
    knowledge.identity.category,
    knowledge.identity.priority,
    knowledge.identity.difficulty,
    ...knowledge.identity.tags,
    knowledge.overview.summary,
    knowledge.overview.purpose,
    knowledge.overview.howWindowsWorks,
    knowledge.overview.whyItExists,
    knowledge.decisionSupport.decisionNotes,
    knowledge.terminology.original,
    knowledge.terminology.localized,
    knowledge.terminology.tweakmind,
    knowledge.currentStatus.scanAvailability,
    ...knowledge.tradeOffs.pros,
    ...knowledge.tradeOffs.cons,
    ...knowledge.tradeOffs.possibleSideEffects,
    ...knowledge.recommendation.recommendedFor,
    ...knowledge.recommendation.notRecommendedFor,
    ...knowledge.recommendation.typicalScenarios,
    ...knowledge.learning.commonMisconceptions
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
}

export function KnowledgePage() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter | null>(null);
  const knowledgeItems = useMemo(() => KnowledgeRepository.getAll(), []);
  const statusById = useMemo(
    () =>
      new Map(
        knowledgeItems.map((knowledge) => [knowledge.identity.id, RuntimeScanService.getDisplayState(knowledge.identity.id)])
      ),
    [knowledgeItems]
  );
  const visibleKnowledge = useMemo(
    () =>
      knowledgeItems.filter((knowledge) => {
        const categoryMatch = selectedCategory ? matchesCategory(selectedCategory, knowledge) : true;
        return categoryMatch && matchesSearch(query, knowledge, settings.terminologyMode);
      }),
    [knowledgeItems, query, selectedCategory, settings.terminologyMode]
  );

  return (
    <div className="tm-page">
      <section className="tm-hero">
        <p className="tm-eyebrow">{t("knowledge.eyebrow")}</p>
        <h2 className="tm-title">{t("knowledge.title")}</h2>
        <p className="tm-subtitle">{t("knowledge.subtitle")}</p>

        <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block max-w-xl flex-1">
            <span className="sr-only">{t("knowledge.search.srOnly")}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("knowledge.search.placeholder")}
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
                    "h-9 tm-chip",
                    isSelected ? "tm-chip-active" : ""
                  ].join(" ")}
                  key={category}
                  onClick={() => setSelectedCategory(isSelected ? null : category)}
                  type="button"
                >
                  {t(categoryFilterKeys[category])}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {visibleKnowledge.length === 0 ? (
          <EmptyState
            actionLabel={knowledgeItems.length === 0 ? t("knowledge.empty.noEntries.action") : t("knowledge.empty.noMatch.action")}
            actionTo={knowledgeItems.length === 0 ? "/dashboard" : undefined}
            description={
              knowledgeItems.length === 0
                ? t("knowledge.empty.noEntries.description")
                : t("knowledge.empty.noMatch.description")
            }
            icon={Search}
            onAction={
              knowledgeItems.length === 0
                ? undefined
                : () => {
                    setQuery("");
                    setSelectedCategory(null);
                  }
            }
            title={knowledgeItems.length === 0 ? t("knowledge.empty.noEntries.title") : t("knowledge.empty.noMatch.title")}
          />
        ) : (
          visibleKnowledge.map((knowledge) => (
            <Link
              className="tm-card focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
              key={knowledge.identity.id}
              to={`/knowledge/detail?id=${knowledge.identity.id}&from=knowledge`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                      {SettingsService.resolveKnowledgeTitle(knowledge)}
                    </h3>
                    <span className="tm-badge-small border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-blue-300">
                      {translateCategory(knowledge.identity.category)}
                    </span>
                    <span className="tm-badge-small border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {t("knowledge.card.statusPrefix")}{" "}
                      {translateScanDisplayState(statusById.get(knowledge.identity.id) ?? "Scan Required")}
                    </span>
                  </div>
                  <p className="mt-3 max-w-3xl tm-body">{knowledge.overview.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {knowledge.identity.tags.slice(0, 4).map((tag) => (
                      <span
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid shrink-0 gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-2 lg:w-80 lg:grid-cols-2 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="border-l-2 border-rose-200 pl-3 dark:border-rose-500/40">
                    <p className="tm-label">{t("knowledge.card.label.risk")}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{translateRiskLevel(knowledge.risks.riskLevel)}</p>
                  </div>
                  <div className="border-l-2 border-emerald-200 pl-3 dark:border-emerald-500/40">
                    <p className="tm-label">{t("knowledge.card.label.expectedBenefit")}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{translateBenefitLevel(knowledge.decisionSupport.expectedBenefit)}</p>
                  </div>
                  <div className="border-l-2 border-blue-200 pl-3 dark:border-blue-500/40">
                    <p className="tm-label">{t("knowledge.card.label.priority")}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">{translatePriority(knowledge.identity.priority)}</p>
                  </div>
                  <div className="border-l-2 border-slate-300 pl-3 dark:border-slate-600">
                    <p className="tm-label">{t("knowledge.card.label.scan")}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {translateScanCapability(RuntimeScanService.getCapability(knowledge.identity.id).scanCapability)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
