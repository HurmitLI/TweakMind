import { Gamepad2, Globe, Search, Shield, Sparkles, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/common/EmptyState";
import { KnowledgeRepository } from "../core/knowledge/KnowledgeRepository";
import { hasPrivacyRelevance } from "../core/knowledge/knowledgeSchemaHelpers";
import { useTranslation } from "../core/localization/LanguageProvider";
import {
  translateBenefitLevel,
  translateCategory,
  translateRiskLevel,
  translateScanDisplayState
} from "../core/localization/localizationHelpers";
import { RuntimeScanService } from "../core/scan/RuntimeScanService";
import { useSettings } from "../core/settings/SettingsProvider";
import { SettingsService } from "../core/settings/SettingsService";
import type { OptimizationCategory } from "../types/optimization";

const categoryFilters = ["Performance", "Gaming", "Privacy", "Security", "Windows"] as const;
type CategoryFilter = (typeof categoryFilters)[number];

const categoryIcons: Record<OptimizationCategory, typeof Zap> = {
  Performance: Zap,
  Gaming: Gamepad2,
  Privacy: Shield,
  Security: Shield,
  Network: Globe,
  Windows: Sparkles
};

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

      <section className="tm-knowledge-list">
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
          visibleKnowledge.map((knowledge) => {
            const CategoryIcon = categoryIcons[knowledge.identity.category];
            const displayState = statusById.get(knowledge.identity.id) ?? "Scan Required";

            return (
            <Link
              className="tm-knowledge-card"
              key={knowledge.identity.id}
              to={`/knowledge/detail?id=${knowledge.identity.id}&from=knowledge`}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="tm-icon-tile-soft">
                    <CategoryIcon size={18} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="tm-typo-body-emphasis">
                        {SettingsService.resolveKnowledgeTitle(knowledge)}
                      </h3>
                      <span className="tm-badge-small">
                        {translateCategory(knowledge.identity.category)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 tm-body-secondary">{knowledge.overview.summary}</p>
                  </div>
                </div>

                <div className="tm-knowledge-meta">
                  <p className="tm-knowledge-meta-item">
                    <span className="tm-knowledge-meta-label">{t("knowledge.card.label.scan")}</span>
                    <span className="tm-knowledge-meta-value">{translateScanDisplayState(displayState)}</span>
                  </p>
                  <p className="tm-knowledge-meta-item">
                    <span className="tm-knowledge-meta-label">{t("knowledge.card.label.risk")}</span>
                    <span className="tm-knowledge-meta-value">{translateRiskLevel(knowledge.risks.riskLevel)}</span>
                  </p>
                  <p className="tm-knowledge-meta-item">
                    <span className="tm-knowledge-meta-label">{t("knowledge.card.label.expectedBenefit")}</span>
                    <span className="tm-knowledge-meta-value">{translateBenefitLevel(knowledge.decisionSupport.expectedBenefit)}</span>
                  </p>
                </div>
              </div>
            </Link>
            );
          })
        )}
      </section>
    </div>
  );
}
