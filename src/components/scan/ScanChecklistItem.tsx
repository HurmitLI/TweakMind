import { Check } from "lucide-react";

interface ScanChecklistItemProps {
  label: string;
  complete: boolean;
}

export function ScanChecklistItem({ label, complete }: ScanChecklistItemProps) {
  return (
    <li
      className={[
        "flex items-center gap-3 rounded-lg border px-4 py-3 transition duration-300",
        complete
          ? "border-emerald-100 bg-white text-slate-950 shadow-sm dark:border-emerald-500/30 dark:bg-slate-800 dark:text-slate-100"
          : "border-slate-200 bg-white/60 text-slate-400 dark:border-slate-700 dark:bg-slate-800/50"
      ].join(" ")}
    >
      <span
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition",
          complete ? "border-emerald-200 bg-emerald-500 text-white" : "border-slate-200 bg-slate-100 text-transparent"
        ].join(" ")}
      >
        <Check size={16} aria-hidden="true" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </li>
  );
}
