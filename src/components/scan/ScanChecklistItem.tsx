import { Check, Loader2 } from "lucide-react";

interface ScanChecklistItemProps {
  label: string;
  complete: boolean;
  active?: boolean;
}

export function ScanChecklistItem({ label, complete, active = false }: ScanChecklistItemProps) {
  const itemClass = complete
    ? "tm-step-item tm-step-item-complete"
    : active
      ? "tm-step-item tm-step-item-scanning"
      : "tm-step-item tm-step-item-pending";

  const markerClass = complete
    ? "tm-step-marker tm-step-marker-complete"
    : active
      ? "tm-step-marker tm-step-marker-active"
      : "tm-step-marker";

  return (
    <li className={itemClass}>
      <span className={markerClass}>
        {complete ? (
          <Check size={16} aria-hidden="true" />
        ) : active ? (
          <Loader2 className="animate-spin" size={14} aria-hidden="true" />
        ) : null}
      </span>
      <span className={complete || active ? "tm-typo-body-emphasis" : "tm-typo-body-secondary"}>{label}</span>
    </li>
  );
}
