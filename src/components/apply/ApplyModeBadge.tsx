import type { OptimizationId } from "../../types/optimization";

type ApplyMode = "mock" | "unsupported";

interface ApplyModeBadgeProps {
  optimizationId: OptimizationId;
}

const styles: Record<ApplyMode, string> = {
  mock: "border-slate-200 bg-slate-100 text-slate-700",
  unsupported: "border-amber-200 bg-amber-50 text-amber-700"
};

export function getApplyMode(optimizationId: OptimizationId): ApplyMode {
  void optimizationId;
  return "mock";
}

export function getApplyModeLabel(optimizationId: OptimizationId) {
  const mode = getApplyMode(optimizationId);

  if (mode === "mock") {
    return "Mock Apply";
  }

  return "Unsupported Apply";
}

export function ApplyModeBadge({ optimizationId }: ApplyModeBadgeProps) {
  const mode = getApplyMode(optimizationId);

  return (
    <span className={["inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", styles[mode]].join(" ")}>
      {getApplyModeLabel(optimizationId)}
    </span>
  );
}
