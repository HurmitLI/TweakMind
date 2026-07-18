import type {
  OptimizationBenefitLevel,
  OptimizationCategory,
  OptimizationId,
  OptimizationRecommendation,
  OptimizationRiskLevel,
  OptimizationStatus
} from "../../types/optimization";
import type { KnowledgePriority } from "../knowledge/KnowledgeDefinition";
import type { DetectionConfidence, RuntimeScanStatus } from "../scan/RuntimeScanModel";

export type DecisionReportSectionId = "recommended" | "optional" | "keep-current" | "unavailable";

export type DecisionReportFilterId = "all" | "real-apply" | "knowledge-only" | "risk" | "category";

export interface DecisionReportItem {
  id: OptimizationId;
  title: string;
  category: OptimizationCategory;
  recommendation: OptimizationRecommendation;
  reason: string;
  currentState: OptimizationStatus;
  riskLevel: OptimizationRiskLevel | "Unknown";
  expectedBenefit: OptimizationBenefitLevel | "Unknown";
  priority: KnowledgePriority;
  canRealApply: boolean;
  canVerify: boolean;
  canRecover: boolean;
  selectable: boolean;
  scanAvailable: boolean;
  runtimeScanStatus: RuntimeScanStatus;
  detectionMethod: string;
  detectionConfidence: DetectionConfidence;
  scanUnavailableReason?: string;
  section: DecisionReportSectionId;
  ignoreConsequence: string;
  /** Parsed recovery minutes when knowledge provides a numeric estimate; otherwise null. */
  estimatedMinutes: number | null;
  lastAppliedLabel?: string;
}

export interface DecisionReportHeroSummary {
  totalRecommendations: number;
  /** Highest known expected benefit among report items, or Unknown when none are known. */
  estimatedImpact: OptimizationBenefitLevel | "Unknown";
  /** Highest known risk among report items, or Unknown when none are known. */
  estimatedRisk: OptimizationRiskLevel | "Unknown";
  /** Sum of known recommended-item minutes, or null when evidence is incomplete. */
  estimatedExecutionMinutes: number | null;
}

export interface DecisionReportSection {
  id: DecisionReportSectionId;
  title: string;
  description: string;
  items: DecisionReportItem[];
}

export type DecisionReportApplyState =
  | "disabled-none"
  | "disabled-unsupported"
  | "disabled-multiple"
  | "ready";

export interface DecisionReportSelectionSummary {
  selectedCount: number;
  supportedSelectedCount: number;
  unsupportedSelectedCount: number;
  estimatedExecutionTime: string;
  highestSelectedRisk: OptimizationRiskLevel | "Unknown" | "None";
  applyState: DecisionReportApplyState;
  applyMessage: string;
  applyTargetId?: OptimizationId;
}

export interface DecisionReportModel {
  hasScan: boolean;
  sections: DecisionReportSection[];
  allItems: DecisionReportItem[];
  hero: DecisionReportHeroSummary;
}
