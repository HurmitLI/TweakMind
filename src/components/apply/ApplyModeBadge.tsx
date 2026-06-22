import type { OptimizationId } from "../../types/optimization";
import { OptimizationCapabilityRegistry } from "../../core/execution/OptimizationCapabilityRegistry";
import type { OptimizationApplyMode } from "../../core/windows/WindowsOptimizationService";

type ApplyMode = OptimizationApplyMode;

interface ApplyModeBadgeProps {
  optimizationId: OptimizationId;
}

const styles: Record<ApplyMode, string> = {
  real: "border-emerald-200 bg-emerald-50 text-emerald-700",
  mock: "border-slate-200 bg-slate-100 text-slate-700",
  unsupported: "border-amber-200 bg-amber-50 text-amber-700"
};

export function getApplyMode(optimizationId: OptimizationId): ApplyMode {
  return OptimizationCapabilityRegistry.get(optimizationId).applyMode;
}

export function getApplyModeLabelForMode(mode: ApplyMode) {
  if (mode === "real") {
    return "Real Apply";
  }

  return mode === "mock" ? "Mock Apply" : "Unsupported Apply";
}

export function getApplyModeLabel(optimizationId: OptimizationId) {
  return getApplyModeLabelForMode(getApplyMode(optimizationId));
}

export function ApplyModeBadge({ optimizationId }: ApplyModeBadgeProps) {
  const mode = getApplyMode(optimizationId);

  return (
    <span className={["inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", styles[mode]].join(" ")}>
      {getApplyModeLabel(optimizationId)}
    </span>
  );
}
