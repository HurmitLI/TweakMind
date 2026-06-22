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
  scanAvailable: boolean;
  runtimeScanStatus: RuntimeScanStatus;
  detectionMethod: string;
  detectionConfidence: DetectionConfidence;
  scanUnavailableReason?: string;
  section: DecisionReportSectionId;
  ignoreConsequence: string;
  estimatedMinutes: number;
  lastAppliedLabel?: string;
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
}
