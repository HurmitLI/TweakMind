import type { OptimizationId } from "../../types/optimization";
import type { KnowledgeBenefits, KnowledgeImpactLevel, KnowledgeScanAvailability } from "./KnowledgeDefinition";

const scannedOptimizations = new Set<OptimizationId>([
  "windows-search",
  "game-mode",
  "core-isolation",
  "delivery-optimization"
]);

export function scanAvailabilityFor(id: OptimizationId): KnowledgeScanAvailability {
  return scannedOptimizations.has(id) ? "Available" : "Not Available";
}

export function hasPrivacyRelevance(benefits: KnowledgeBenefits): boolean {
  return benefits.privacyImpact === "Low" || benefits.privacyImpact === "Medium" || benefits.privacyImpact === "High";
}

export function formatImpactLevel(level: KnowledgeImpactLevel): string {
  return level;
}
