import type { OptimizationId } from "../../types/optimization";
import { ScanCapabilityRegistry } from "../scan/ScanCapabilityRegistry";
import type { KnowledgeBenefits, KnowledgeImpactLevel, KnowledgeScanAvailability } from "./KnowledgeDefinition";

export function scanAvailabilityFor(id: OptimizationId): KnowledgeScanAvailability {
  const capability = ScanCapabilityRegistry.get(id);

  if (capability.scanCapability === "Native Detection") {
    return "Available";
  }

  return "Not Available";
}

export function hasPrivacyRelevance(benefits: KnowledgeBenefits): boolean {
  return benefits.privacyImpact === "Low" || benefits.privacyImpact === "Medium" || benefits.privacyImpact === "High";
}

export function formatImpactLevel(level: KnowledgeImpactLevel): string {
  return level;
}
