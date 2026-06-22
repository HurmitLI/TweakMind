import { Check } from "lucide-react";

interface ScanChecklistItemProps {
  label: string;
  complete: boolean;
}

export function ScanChecklistItem({ label, complete }: ScanChecklistItemProps) {
  return (
    <li className={complete ? "tm-step-item tm-step-item-complete" : "tm-step-item tm-step-item-pending"}>
      <span className={complete ? "tm-step-marker tm-step-marker-complete" : "tm-step-marker"}>
        <Check size={16} aria-hidden="true" />
      </span>
      <span className="tm-typo-body-emphasis">{label}</span>
    </li>
  );
}
