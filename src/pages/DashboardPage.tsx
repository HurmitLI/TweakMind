import { ArrowRight, CheckCircle2, CloudOff, RotateCcw, ScanLine, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "../core/localization/LanguageProvider";
import { readStoredScanResult } from "../core/scan/ScanResult";

const trustPrincipleKeys = [
  {
    titleKey: "home.trust.localScan.title" as const,
    descriptionKey: "home.trust.localScan.description" as const,
    icon: ShieldCheck
  },
  {
    titleKey: "home.trust.noAuto.title" as const,
    descriptionKey: "home.trust.noAuto.description" as const,
    icon: CheckCircle2
  },
  {
    titleKey: "home.trust.verifiable.title" as const,
    descriptionKey: "home.trust.verifiable.description" as const,
    icon: ScanLine
  },
  {
    titleKey: "home.trust.recoverable.title" as const,
    descriptionKey: "home.trust.recoverable.description" as const,
    icon: RotateCcw
  }
];

const supportedOptimizations = [
  { name: "Windows Search", mode: "executable" as const },
  { name: "Game Mode", mode: "executable" as const },
  { name: "Core Isolation", mode: "executable" as const },
  { name: "Delivery Optimization", mode: "executable" as const },
  { name: "SysMain", mode: "executable" as const },
  { name: "HAGS", mode: "executable" as const },
  { name: "Power Plan", mode: "executable" as const },
  { name: "Background Apps", mode: "knowledge-only" as const },
  { name: "Startup Apps", mode: "knowledge-only" as const },
  { name: "Visual Effects", mode: "knowledge-only" as const },
  { name: "Windows Update Active Hours", mode: "knowledge-only" as const }
];

const philosophyBlockKeys = [
  {
    titleKey: "home.philosophy.understand.title" as const,
    descriptionKey: "home.philosophy.understand.description" as const
  },
  {
    titleKey: "home.philosophy.aiDecides.title" as const,
    descriptionKey: "home.philosophy.aiDecides.description" as const
  },
  {
    titleKey: "home.philosophy.recover.title" as const,
    descriptionKey: "home.philosophy.recover.description" as const
  }
];

const heroTrustRowKeys = [
  { labelKey: "home.hero.trust.localScan" as const, icon: ShieldCheck },
  { labelKey: "home.hero.trust.noUpload" as const, icon: CloudOff },
  { labelKey: "home.hero.trust.noAutoModify" as const, icon: CheckCircle2 },
  { labelKey: "home.hero.trust.recoverable" as const, icon: RotateCcw }
];

export function DashboardPage() {
  const { t } = useTranslation();
  const hasScanResult = readStoredScanResult() !== null;

  return (
    <div className="tm-home-shell">
      <div className="tm-home-grid">
        <section className="tm-home-hero tm-home-panel">
          <div className="tm-home-hero-content">
            <h1 className="tm-home-hero-title">
              {t("home.hero.titleLead")}{" "}
              <span className="tm-home-hero-title-unit">{t("home.hero.titleUnit")}</span>
              <br />
              {t("home.hero.titleTail")}
            </h1>
            <p className="tm-home-hero-subtitle">{t("home.hero.subtitle")}</p>
            <Link className="tm-home-cta tm-button-primary" to="/scan">
              {t("home.hero.cta")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <ul className="tm-home-trust-row">
              {heroTrustRowKeys.map((item) => {
                const Icon = item.icon;

                return (
                  <li className="tm-home-trust-row-item" key={item.labelKey}>
                    <Icon aria-hidden="true" size={12} />
                    <span>{t(item.labelKey)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="tm-home-block">
          <h2 className="tm-home-heading">{t("home.section.trustHeading")}</h2>
          <div className="tm-home-panel tm-home-trust-panel">
            <div className="tm-home-trust-columns">
              {trustPrincipleKeys.map((principle) => {
                const Icon = principle.icon;

                return (
                  <article className="tm-home-trust-column" key={principle.titleKey}>
                    <Icon aria-hidden="true" className="tm-home-trust-column-icon" size={16} />
                    <h3>{t(principle.titleKey)}</h3>
                    <p>{t(principle.descriptionKey)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="tm-home-block">
          <div className="tm-home-panel tm-home-primary-action">
            <div className="tm-home-primary-action-copy">
              <h2 className="tm-home-primary-action-title">{t("home.primary.title")}</h2>
              <p className="tm-home-primary-action-description">{t("home.primary.description")}</p>
              <p className="tm-home-primary-action-meta">{t("home.primary.meta")}</p>
            </div>
            <div className="tm-home-primary-action-actions">
              <Link className="tm-home-cta tm-button-primary tm-home-primary-action-button" to="/scan">
                {t("home.primary.cta")}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              {hasScanResult ? (
                <Link className="tm-link-accent tm-home-primary-report-link" to="/report">
                  {t("home.primary.reportCta")}
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="tm-home-block">
          <h2 className="tm-home-heading">{t("home.section.optimizationsHeading")}</h2>
          <div className="tm-home-panel tm-home-optimization-panel">
            <ul className="tm-home-optimization-columns">
              {supportedOptimizations.map((optimization) => (
                <li className="tm-home-optimization-item" key={optimization.name}>
                  <span>{optimization.name}</span>
                  <span className={optimization.mode === "executable" ? "tm-home-optimization-mode" : "tm-home-optimization-mode tm-home-optimization-mode-muted"}>
                    {optimization.mode === "executable"
                      ? t("unsupported.capability.realSupported")
                      : t("unsupported.capability.knowledgeOnly")}
                  </span>
                </li>
              ))}
            </ul>
            <div className="tm-home-optimization-footer">
              <Link className="tm-link-accent" to="/knowledge">
                {t("home.optimizations.viewAll")}
              </Link>
            </div>
          </div>
        </section>

        <section className="tm-home-block">
          <h2 className="tm-home-heading">{t("home.section.philosophyHeading")}</h2>
          <div className="tm-home-philosophy-grid">
            {philosophyBlockKeys.map((block) => (
              <article className="tm-home-philosophy-block" key={block.titleKey}>
                <h3>{t(block.titleKey)}</h3>
                <p>{t(block.descriptionKey)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
