import type { ReactNode } from "react";

interface DecisionSectionProps {
  title: string;
  children: ReactNode;
}

export function DecisionSection({ title, children }: DecisionSectionProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white/95 p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      <div className="mt-4 text-sm leading-6 text-slate-600">{children}</div>
    </section>
  );
}
