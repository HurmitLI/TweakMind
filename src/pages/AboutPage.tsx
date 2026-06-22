import { ExternalLink, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AppInfo } from "../core/app/AppInfo";
import { useTranslation } from "../core/localization/LanguageProvider";

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="tm-field">
      <dt className="tm-label">{label}</dt>
      <dd className="tm-value">{value}</dd>
    </div>
  );
}

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="tm-page">
      <section className="tm-hero">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="tm-eyebrow">{t("about.eyebrow")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="tm-title">{AppInfo.name}</h2>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:border-blue-400/40 dark:bg-blue-950/40 dark:text-blue-300">
                {t("app.releasePhase")}
              </span>
            </div>
            <p className="tm-subtitle">{t("app.description")}</p>
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
        <div className="tm-field">
          <dt className="tm-label">{t("about.label.githubRepository")}</dt>
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

      <section className="tm-panel">
        <h3 className="tm-section-title">{t("about.alpha.title")}</h3>
        <p className="mt-2 max-w-3xl tm-body">{t("about.alpha.description")}</p>
        <Link
          className="mt-5 tm-button-secondary"
          to="/dashboard"
        >
          {t("common.action.returnHome")}
        </Link>
      </section>
    </div>
  );
}
