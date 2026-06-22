import { BookOpen, CheckCircle2, History, MonitorCheck, RotateCcw, Scale } from "lucide-react";
import { DashboardCard } from "../components/dashboard/DashboardCard";
import { useTranslation } from "../core/localization/LanguageProvider";

export function DashboardPage() {
  const { t } = useTranslation();

  const dashboardCards = [
    {
      title: t("dashboard.card.analyze.title"),
      description: t("dashboard.card.analyze.description"),
      helperText: t("dashboard.card.analyze.helperText"),
      metaText: t("dashboard.card.analyze.metaText"),
      actionLabel: t("dashboard.card.analyze.actionLabel"),
      to: "/scan",
      icon: MonitorCheck,
      tone: "primary" as const
    },
    {
      title: t("dashboard.card.knowledge.title"),
      description: t("dashboard.card.knowledge.description"),
      to: "/knowledge",
      icon: BookOpen,
      tone: "secondary" as const
    },
    {
      title: t("dashboard.card.history.title"),
      description: t("dashboard.card.history.description"),
      to: "/history",
      icon: History,
      tone: "secondary" as const
    }
  ];

  const highlights = [
    {
      title: t("dashboard.highlight.understand.title"),
      description: t("dashboard.highlight.understand.description"),
      icon: CheckCircle2
    },
    {
      title: t("dashboard.highlight.tradeoffs.title"),
      description: t("dashboard.highlight.tradeoffs.description"),
      icon: Scale
    },
    {
      title: t("dashboard.highlight.recover.title"),
      description: t("dashboard.highlight.recover.description"),
      icon: RotateCcw
    }
  ];

  return (
    <div className="tm-page">
      <section className="tm-hero-accent">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
        <div className="max-w-4xl">
          <h2 className="tm-title-xl">{t("dashboard.hero.title")}</h2>
          <p className="mt-4 text-xl leading-8 text-slate-700 dark:text-slate-200">{t("dashboard.hero.subtitle")}</p>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">{t("dashboard.hero.body")}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
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

      <section className="tm-panel">
        <h3 className="tm-section-title">{t("dashboard.why.title")}</h3>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {highlights.map((highlight) => {
            const Icon = highlight.icon;

            return (
              <article className="rounded-lg border border-slate-100 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-800/70" key={highlight.title}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-950/40 dark:text-blue-300">
                  <Icon size={19} aria-hidden="true" />
                </div>
                <h4 className="mt-4 text-base font-semibold tracking-tight text-slate-950 dark:text-slate-100">{highlight.title}</h4>
                <p className="mt-2 tm-body">{highlight.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
