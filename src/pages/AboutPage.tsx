import { ExternalLink, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AppInfo } from "../core/app/AppInfo";
import { useTranslation } from "../core/localization/LanguageProvider";

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="tm-card-metadata">
      <dt className="tm-label">{label}</dt>
      <dd className="tm-value">{value}</dd>
    </div>
  );
}

const limitationKeys = [
  {
    key: "about.limitations.item.executableCount" as const,
    params: { count: AppInfo.executableOptimizationCount }
  },
  {
    key: "about.limitations.item.knowledgeOnly" as const,
    params: { count: AppInfo.knowledgeOnlyOptimizationCount }
  },
  { key: "about.limitations.item.windowsDesktop" as const },
  { key: "about.limitations.item.administrator" as const },
  { key: "about.limitations.item.partialLocalization" as const },
  { key: "about.limitations.item.rescanReplacesResults" as const },
  { key: "about.limitations.item.noAi" as const }
];

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="tm-layout-page">
      <section className="tm-card-hero">
        <div className="flex flex-col tm-gap-lg lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="tm-eyebrow">{t("about.eyebrow")}</p>
            <div className="flex flex-wrap items-center tm-gap-sm">
              <h2 className="tm-typo-page">{AppInfo.name}</h2>
              <span className="tm-status-badge">{t("app.releasePhase")}</span>
            </div>
            <p className="tm-subtitle">{t("app.description")}</p>
            <p className="tm-mt-md max-w-2xl tm-typo-caption">{t("app.tagline")}</p>
          </div>
          <div className="tm-about-icon">
            <Sparkles size={30} aria-hidden="true" />
          </div>
        </div>
      </section>

      <dl className="tm-form-grid tm-form-grid-2">
        <InfoField label={t("about.label.version")} value={t("app.versionLabel", { version: AppInfo.version })} />
        <InfoField label={t("about.label.license")} value={t("app.licenseName")} />
        <InfoField label={t("about.label.copyright")} value={t("app.copyright", { year: new Date().getFullYear() })} />
        <div className="tm-card-metadata">
          <dt className="tm-label">{t("about.label.githubRepository")}</dt>
          <dd className="tm-mt-md">
            <a className="tm-link-accent" href={AppInfo.repositoryUrl} rel="noreferrer" target="_blank">
              {AppInfo.repositoryUrl.replace("https://", "")}
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          </dd>
        </div>
      </dl>

      <section className="tm-section-card">
        <h3 className="tm-typo-section">{t("about.beta.title")}</h3>
        <p className="tm-mt-md max-w-3xl tm-typo-body">{t("about.beta.description")}</p>
        <p className="tm-mt-md tm-typo-body-secondary">
          <a className="tm-link-accent" href={AppInfo.issueTrackerUrl} rel="noreferrer" target="_blank">
            {t("about.beta.feedback")}
          </a>
        </p>
      </section>

      <section className="tm-section-card">
        <h3 className="tm-typo-section">{t("about.limitations.title")}</h3>
        <ul className="tm-mt-md max-w-3xl tm-layout-stack tm-typo-body">
          {limitationKeys.map((item) => (
            <li className="list-disc pl-5" key={item.key}>
              {t(item.key, item.params)}
            </li>
          ))}
        </ul>
        <Link className="tm-mt-lg tm-button-secondary" to="/dashboard">
          {t("common.action.returnHome")}
        </Link>
      </section>
    </div>
  );
}
