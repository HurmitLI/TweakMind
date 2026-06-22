import { DecisionSection } from "./DecisionSection";

interface BulletListSectionProps {
  title: string;
  items: string[];
}

export function BulletListSection({ title, items }: BulletListSectionProps) {
  return (
    <DecisionSection title={title}>
      <ul className="grid gap-2">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </DecisionSection>
  );
}
