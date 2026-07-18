import type {
  OptimizationBenefitLevel,
  OptimizationCategory,
  OptimizationRecommendation,
  OptimizationRiskLevel,
  OptimizationStatus
} from "../../types/optimization";
import { OptimizationCapabilityRegistry } from "../execution/OptimizationCapabilityRegistry";
import { LocalizationService } from "../localization/LocalizationService";
import type { AppLanguage } from "../settings/SettingsService";
import type { KnowledgePriority } from "../knowledge/KnowledgeDefinition";
import { KnowledgeRepository } from "../knowledge/KnowledgeRepository";
import type { RuntimeScanStatus } from "../scan/RuntimeScanModel";
import { RuntimeScanService } from "../scan/RuntimeScanService";
import type { OptimizationScanResult, ScanResult } from "../scan/ScanResult";
import { formatRuntimeScanLabel } from "../scan/RuntimeScanModel";
import { WindowsOptimizationService } from "../windows/WindowsOptimizationService";
import type {
  DecisionReportApplyState,
  DecisionReportFilterId,
  DecisionReportHeroSummary,
  DecisionReportItem,
  DecisionReportModel,
  DecisionReportSection,
  DecisionReportSectionId,
  DecisionReportSelectionSummary
} from "./DecisionReportTypes";

function getSectionMeta(id: DecisionReportSectionId) {
  switch (id) {
    case "recommended":
      return {
        title: LocalizationService.translate("report.section.recommended.title"),
        description: LocalizationService.translate("report.section.recommended.description")
      };
    case "optional":
      return {
        title: LocalizationService.translate("report.section.optional.title"),
        description: LocalizationService.translate("report.section.optional.description")
      };
    case "keep-current":
      return {
        title: LocalizationService.translate("report.section.keepCurrent.title"),
        description: LocalizationService.translate("report.section.keepCurrent.description")
      };
    case "unavailable":
      return {
        title: LocalizationService.translate("report.section.unavailable.title"),
        description: LocalizationService.translate("report.section.unavailable.description")
      };
  }
}

const sectionOrder: DecisionReportSectionId[] = ["recommended", "optional", "keep-current", "unavailable"];

const priorityOrder: Record<KnowledgePriority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
  Unknown: 3
};

const riskOrder: Record<OptimizationRiskLevel | "Unknown", number> = {
  High: 0,
  Medium: 1,
  Low: 2,
  Unknown: 3
};

const benefitOrder: Record<OptimizationBenefitLevel | "Unknown", number> = {
  High: 0,
  Medium: 1,
  Low: 2,
  Unknown: 3
};

function parseEstimatedMinutes(value: string | undefined): number | null {
  if (!value || value === "Unknown") {
    return null;
  }

  const match = value.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function highestKnownLevel<T extends "Low" | "Medium" | "High">(
  values: Array<T | "Unknown">,
  order: Record<T | "Unknown", number>
): T | "Unknown" {
  return values.reduce<T | "Unknown">((current, value) => {
    if (value === "Unknown") {
      return current;
    }

    if (current === "Unknown") {
      return value;
    }

    return order[value] < order[current] ? value : current;
  }, "Unknown");
}

function summarizeHero(items: DecisionReportItem[]): DecisionReportHeroSummary {
  const estimatedImpact = highestKnownLevel(
    items.map((item) => item.expectedBenefit),
    benefitOrder
  );
  const estimatedRisk = highestKnownLevel(
    items.map((item) => item.riskLevel),
    riskOrder
  );

  const recommendedItems = items.filter((item) => item.section === "recommended");
  const recommendedMinutes = recommendedItems.map((item) => item.estimatedMinutes);
  const estimatedExecutionMinutes =
    recommendedItems.length > 0 && recommendedMinutes.every((value): value is number => value !== null)
      ? recommendedMinutes.reduce((total, value) => total + value, 0)
      : null;

  return {
    totalRecommendations: items.length,
    estimatedImpact,
    estimatedRisk,
    estimatedExecutionMinutes
  };
}

function emptyHeroSummary(): DecisionReportHeroSummary {
  return {
    totalRecommendations: 0,
    estimatedImpact: "Unknown",
    estimatedRisk: "Unknown",
    estimatedExecutionMinutes: null
  };
}

function classifySection(
  recommendation: OptimizationRecommendation,
  runtimeScanStatus: RuntimeScanStatus
): DecisionReportSectionId {
  if (runtimeScanStatus === "Not Supported Yet") {
    return "unavailable";
  }

  if (recommendation === "Recommended") {
    return "recommended";
  }

  if (recommendation === "Optional") {
    return "optional";
  }

  if (recommendation === "Keep Default" || recommendation === "Keep Enabled" || recommendation === "Already Optimized") {
    return "keep-current";
  }

  return "optional";
}

function buildItem(result: OptimizationScanResult): DecisionReportItem | null {
  const knowledge = KnowledgeRepository.getById(result.id);

  if (!knowledge) {
    return null;
  }

  const capabilities = OptimizationCapabilityRegistry.get(result.id);
  const runtimeScan = RuntimeScanService.readRuntimeFromResult(result);
  const scanAvailable = runtimeScan.runtimeScanStatus !== "Not Supported Yet";
  const history = WindowsOptimizationService.getHistory().find((entry) => entry.optimizationId === result.id);
  const lastAppliedLabel = history
    ? new Date(Number(history.timestamp) * 1000).toLocaleString()
    : undefined;
  const currentState =
    runtimeScan.runtimeScanStatus === "Detected"
      ? runtimeScan.currentRuntimeState
      : (formatRuntimeScanLabel(runtimeScan) as OptimizationStatus);

  return {
    id: result.id,
    title: knowledge.identity.title,
    category: knowledge.identity.category,
    recommendation: result.recommendation,
    reason: result.reason,
    currentState,
    riskLevel: knowledge.risks.riskLevel,
    expectedBenefit: knowledge.decisionSupport.expectedBenefit,
    priority: knowledge.identity.priority,
    canRealApply: capabilities.canRealApply,
    canVerify: capabilities.canVerify,
    canRecover: capabilities.canRecover,
    selectable: result.selectable && capabilities.canRealApply,
    scanAvailable,
    runtimeScanStatus: runtimeScan.runtimeScanStatus,
    detectionMethod: runtimeScan.detectionMethod,
    detectionConfidence: runtimeScan.detectionConfidence,
    scanUnavailableReason: runtimeScan.unavailableReason,
    section: classifySection(result.recommendation, runtimeScan.runtimeScanStatus),
    ignoreConsequence: knowledge.tradeOffs.cons[0] ?? knowledge.decisionSupport.decisionNotes,
    estimatedMinutes: parseEstimatedMinutes(
      knowledge.recovery.estimatedTime === "Unknown" ? undefined : knowledge.recovery.estimatedTime
    ),
    lastAppliedLabel
  };
}

function sortItems(items: DecisionReportItem[]): DecisionReportItem[] {
  return [...items].sort((left, right) => {
    const priorityDiff = priorityOrder[left.priority] - priorityOrder[right.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const riskDiff = riskOrder[left.riskLevel] - riskOrder[right.riskLevel];
    if (riskDiff !== 0) {
      return riskDiff;
    }

    const benefitDiff = benefitOrder[left.expectedBenefit] - benefitOrder[right.expectedBenefit];
    if (benefitDiff !== 0) {
      return benefitDiff;
    }

    return left.title.localeCompare(right.title);
  });
}

function buildSections(items: DecisionReportItem[]): DecisionReportSection[] {
  return sectionOrder.map((id) => ({
    id,
    ...getSectionMeta(id),
    items: sortItems(items.filter((item) => item.section === id))
  }));
}

export class DecisionReportService {
  /** Deterministic hero metrics from report items; never invents missing levels or times. */
  static summarizeHeroMetrics(items: DecisionReportItem[]): DecisionReportHeroSummary {
    return summarizeHero(items);
  }

  static buildModel(scanResult: ScanResult | null, language: AppLanguage = LocalizationService.getLanguage()): DecisionReportModel {
    void language;
    if (!scanResult) {
      return {
        hasScan: false,
        sections: sectionOrder.map((id) => ({
          id,
          ...getSectionMeta(id),
          items: []
        })),
        allItems: [],
        hero: emptyHeroSummary()
      };
    }

    const allItems = sortItems(
      scanResult.optimizationResults
        .map((result) => buildItem(result))
        .filter((item): item is DecisionReportItem => item !== null)
    );

    return {
      hasScan: true,
      sections: buildSections(allItems),
      allItems,
      hero: summarizeHero(allItems)
    };
  }

  static filterItems(
    items: DecisionReportItem[],
    filter: DecisionReportFilterId,
    riskLevel?: OptimizationRiskLevel,
    category?: OptimizationCategory
  ): DecisionReportItem[] {
    return items.filter((item) => {
      if (filter === "real-apply" && !item.canRealApply) {
        return false;
      }

      if (filter === "knowledge-only" && item.canRealApply) {
        return false;
      }

      if (filter === "risk" && riskLevel && item.riskLevel !== riskLevel) {
        return false;
      }

      if (filter === "category" && category && item.category !== category) {
        return false;
      }

      return true;
    });
  }

  static summarizeSelection(
    selectedIds: string[],
    items: DecisionReportItem[],
    language: AppLanguage = LocalizationService.getLanguage()
  ): DecisionReportSelectionSummary {
    void language;
    const selectedItems = items.filter((item) => selectedIds.includes(item.id) && item.selectable);
    const supportedSelected = selectedItems.filter((item) => item.canRealApply);
    const unsupportedSelected = selectedItems.filter((item) => !item.canRealApply);

    const highestSelectedRisk = selectedItems.reduce<OptimizationRiskLevel | "Unknown" | "None">((current, item) => {
      if (current === "None") {
        return item.riskLevel;
      }

      if (item.riskLevel === "Unknown") {
        return current;
      }

      if (current === "Unknown") {
        return item.riskLevel;
      }

      return riskOrder[item.riskLevel] < riskOrder[current] ? item.riskLevel : current;
    }, "None");

    const selectedMinutes = selectedItems.map((item) => item.estimatedMinutes);
    const allSelectedMinutesKnown =
      selectedItems.length > 0 && selectedMinutes.every((value): value is number => value !== null);
    const estimatedMinutes = allSelectedMinutesKnown
      ? selectedMinutes.reduce((total, value) => total + value, 0)
      : null;
    const estimatedExecutionTime =
      selectedItems.length === 0
        ? LocalizationService.translate("report.selection.noneSelected")
        : estimatedMinutes === null
          ? LocalizationService.translate("report.metric.pendingEvaluation")
          : estimatedMinutes <= 1
            ? LocalizationService.translate("report.selection.aboutOneMinute")
            : LocalizationService.translate("report.selection.aboutMinutes", { count: estimatedMinutes });

    let applyState: DecisionReportApplyState = "disabled-none";
    let applyMessage = LocalizationService.translate("report.selection.applyMessage.selectSupported");
    let applyTargetId: DecisionReportSelectionSummary["applyTargetId"];

    if (selectedItems.length === 0) {
      applyState = "disabled-none";
      applyMessage = LocalizationService.translate("report.selection.applyMessage.selectAtLeastOne");
    } else if (supportedSelected.length === 0) {
      applyState = "disabled-unsupported";
      applyMessage = LocalizationService.translate("report.selection.applyMessage.unsupportedOnly");
    } else if (supportedSelected.length > 1) {
      applyState = "disabled-multiple";
      applyMessage = LocalizationService.translate("report.selection.applyMessage.multipleSelected");
    } else {
      applyState = "ready";
      applyMessage = LocalizationService.translate("report.selection.applyMessage.ready");
      applyTargetId = supportedSelected[0]?.id;
    }

    if (unsupportedSelected.length > 0 && supportedSelected.length > 0) {
      applyMessage = LocalizationService.translate("report.selection.applyMessage.mixedSelection", {
        unsupportedCount: unsupportedSelected.length,
        message: applyMessage
      });
    }

    return {
      selectedCount: selectedItems.length,
      supportedSelectedCount: supportedSelected.length,
      unsupportedSelectedCount: unsupportedSelected.length,
      estimatedExecutionTime,
      highestSelectedRisk,
      applyState,
      applyMessage,
      applyTargetId
    };
  }
}
