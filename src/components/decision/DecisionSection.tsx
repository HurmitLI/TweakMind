import type { ReactNode } from "react";

interface DecisionSectionProps {
  title: string;
  children: ReactNode;
}

export function DecisionSection({ title, children }: DecisionSectionProps) {
  return (
    <section className="tm-card">
      <h3 className="tm-typo-section">{title}</h3>
      <div className="tm-mt-md tm-typo-body">{children}</div>
    </section>
  );
}
