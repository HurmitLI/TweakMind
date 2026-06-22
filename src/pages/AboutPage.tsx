import { ExternalLink, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AppInfo } from "../core/app/AppInfo";
import { useTranslation } from "../core/localization/LanguageProvider";

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">{value}</dd>
    </div>
  );
}

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-white/70 bg-white/85 px-8 py-8 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{t("about.eyebrow")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{AppInfo.name}</h2>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:border-blue-400/40 dark:bg-blue-950/40 dark:text-blue-300">
                {t("app.releasePhase")}
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">{t("app.description")}</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{t("app.tagline")}</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-500 text-slate-950">
            <Sparkles size={30} aria-hidden="true" />
          </div>
        </div>
      </section>

      <dl className="grid gap-4 md:grid-cols-2">
        <InfoField label={t("about.label.version")} value={t("app.versionLabel", { version: AppInfo.version })} />
        <InfoField label={t("about.label.license")} value={t("app.licenseName")} />
        <InfoField label={t("about.label.copyright")} value={t("app.copyright", { year: new Date().getFullYear() })} />
        <div className="rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t("about.label.githubRepository")}</dt>
          <dd className="mt-2">
            <a
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
              href={AppInfo.repositoryUrl}
              rel="noreferrer"
              target="_blank"
            >
              {AppInfo.repositoryUrl.replace("https://", "")}
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          </dd>
        </div>
      </dl>

      <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">{t("about.alpha.title")}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{t("about.alpha.description")}</p>
        <Link
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          to="/dashboard"
        >
          {t("common.action.returnHome")}
        </Link>
      </section>
    </div>
  );
}
