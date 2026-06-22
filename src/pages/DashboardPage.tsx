import { BookOpen, CheckCircle2, History, MonitorCheck, RotateCcw, Scale } from "lucide-react";
import { DashboardCard } from "../components/dashboard/DashboardCard";

const dashboardCards = [
  {
    title: "Analyze My PC",
    description: "Analyze the current Windows configuration and identify optimizations worth considering.",
    helperText: "Safe analysis. No changes will be made.",
    metaText: "About 30 seconds.",
    actionLabel: "Start analysis",
    to: "/scan",
    icon: MonitorCheck,
    tone: "primary" as const
  },
  {
    title: "Knowledge Base",
    description: "Browse all supported Windows optimizations before making changes.",
    to: "/knowledge",
    icon: BookOpen,
    tone: "secondary" as const
  },
  {
    title: "Optimization History",
    description: "Review previous optimizations and restore them if necessary.",
    to: "/history",
    icon: History,
    tone: "secondary" as const
  }
];

const highlights = [
  {
    title: "Understand before you optimize",
    description: "Plain-language explanations show what each optimization changes.",
    icon: CheckCircle2
  },
  {
    title: "See every trade-off",
    description: "Benefits and downsides are shown together so decisions stay balanced.",
    icon: Scale
  },
  {
    title: "Recover anytime",
    description: "Recovery guidance is part of the decision, not an afterthought.",
    icon: RotateCcw
  }
];

export function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative overflow-hidden rounded-lg border border-white/70 bg-white/80 px-8 py-10 shadow-sm backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
        <div className="max-w-4xl">
          <h2 className="text-5xl font-semibold tracking-tight text-slate-950">TweakMind</h2>
          <p className="mt-4 text-xl leading-8 text-slate-700">
            Make every Windows optimization an informed decision.
          </p>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Understand what changes, why it matters, and how to recover before you optimize.
          </p>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {dashboardCards.map((card) => (
          <DashboardCard
            actionLabel={card.actionLabel}
            description={card.description}
            helperText={card.helperText}
            icon={card.icon}
            key={card.title}
            metaText={card.metaText}
            title={card.title}
            to={card.to}
            tone={card.tone}
          />
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">Why TweakMind?</h3>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {highlights.map((highlight) => {
            const Icon = highlight.icon;

            return (
              <article className="rounded-lg border border-slate-100 bg-slate-50/80 p-5" key={highlight.title}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
                  <Icon size={19} aria-hidden="true" />
                </div>
                <h4 className="mt-4 text-base font-semibold tracking-tight text-slate-950">{highlight.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{highlight.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
