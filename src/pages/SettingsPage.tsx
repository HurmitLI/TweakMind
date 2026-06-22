import type { ReactNode } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AppInfo } from "../core/app/AppInfo";
import { useTranslation } from "../core/localization/LanguageProvider";
import { OnboardingService } from "../core/onboarding/OnboardingService";
import { useSettings } from "../core/settings/SettingsProvider";
import type { AppLanguage, AppTheme, TerminologyMode } from "../core/settings/SettingsService";

const languageOptions: { value: AppLanguage; labelKey: "settings.language.en" | "settings.language.zhCN" }[] = [
  { value: "en", labelKey: "settings.language.en" },
  { value: "zh-CN", labelKey: "settings.language.zhCN" }
];

const themeOptions: { value: AppTheme; labelKey: "settings.theme.system" | "settings.theme.light" | "settings.theme.dark" }[] = [
  { value: "system", labelKey: "settings.theme.system" },
  { value: "light", labelKey: "settings.theme.light" },
  { value: "dark", labelKey: "settings.theme.dark" }
];

const terminologyOptions: {
  value: TerminologyMode;
  labelKey: "settings.terminology.original" | "settings.terminology.localized" | "settings.terminology.tweakmind";
}[] = [
  { value: "original", labelKey: "settings.terminology.original" },
  { value: "localized", labelKey: "settings.terminology.localized" },
  { value: "tweakmind", labelKey: "settings.terminology.tweakmind" }
];

function PreferenceSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="tm-settings-section">
      <h3 className="tm-typo-section">{title}</h3>
      <p className="tm-mt-md max-w-2xl tm-typo-body-secondary">{description}</p>
      <div className="tm-mt-lg">{children}</div>
    </section>
  );
}

function OptionButtons<T extends string>({
  options,
  value,
  onChange
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap tm-gap-sm">
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            className={["h-9 tm-chip", isSelected ? "tm-chip-active" : ""].join(" ")}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ApplicationLink({ href, label }: { href: string; label: string }) {
  return (
    <a className="tm-link-accent" href={href} rel="noreferrer" target="_blank">
      {label}
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();

  return (
    <div className="tm-layout-page">
      <section className="tm-card-hero">
        <p className="tm-eyebrow">{t("settings.eyebrow")}</p>
        <h2 className="tm-typo-page">{t("settings.title")}</h2>
        <p className="tm-subtitle">{t("settings.subtitle")}</p>
      </section>

      <div className="tm-settings-panel">
        <PreferenceSection description={t("settings.language.description")} title={t("settings.language.title")}>
          <OptionButtons
            onChange={(language) => updateSettings({ language })}
            options={languageOptions.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
            value={settings.language}
          />
        </PreferenceSection>

        <PreferenceSection description={t("settings.theme.description")} title={t("settings.theme.title")}>
          <OptionButtons
            onChange={(theme) => updateSettings({ theme })}
            options={themeOptions.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
            value={settings.theme}
          />
        </PreferenceSection>

        <PreferenceSection description={t("settings.terminology.description")} title={t("settings.terminology.title")}>
          <OptionButtons
            onChange={(terminologyMode) => updateSettings({ terminologyMode })}
            options={terminologyOptions.map((option) => ({ value: option.value, label: t(option.labelKey) }))}
            value={settings.terminologyMode}
          />
        </PreferenceSection>

        <PreferenceSection description={t("settings.onboarding.description")} title={t("settings.onboarding.title")}>
          <button
            className="tm-button-secondary"
            onClick={() => {
              OnboardingService.reset();
              navigate("/onboarding");
            }}
            type="button"
          >
            {t("settings.onboarding.action")}
          </button>
        </PreferenceSection>
      </div>

      <section className="tm-about-panel-quiet">
        <div className="flex flex-col tm-gap-lg lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="tm-eyebrow">{t("settings.application.title")}</p>
            <h3 className="tm-typo-section">{AppInfo.name}</h3>
            <p className="tm-mt-sm max-w-2xl tm-typo-caption">{t("settings.application.description")}</p>
          </div>
          <div className="tm-about-icon">
            <Sparkles size={22} aria-hidden="true" />
          </div>
        </div>

        <dl className="tm-mt-lg tm-form-grid tm-form-grid-2">
          <div className="tm-field-plain">
            <dt className="tm-label">{t("settings.application.version")}</dt>
            <dd className="tm-value tm-typo-caption">{t("app.versionLabel", { version: AppInfo.version })}</dd>
          </div>
          <div className="tm-field-plain">
            <dt className="tm-label">{t("settings.application.license")}</dt>
            <dd className="tm-value tm-typo-caption">{AppInfo.licenseName}</dd>
          </div>
          <div className="tm-field-plain">
            <dt className="tm-label">{t("settings.application.repository")}</dt>
            <dd className="tm-mt-sm">
              <ApplicationLink href={AppInfo.repositoryUrl} label={AppInfo.repositoryUrl.replace("https://", "")} />
            </dd>
          </div>
          <div className="tm-field-plain">
            <dt className="tm-label">{t("settings.application.issueTracker")}</dt>
            <dd className="tm-mt-sm">
              <ApplicationLink href={AppInfo.issueTrackerUrl} label={AppInfo.issueTrackerUrl.replace("https://", "")} />
            </dd>
          </div>
        </dl>
        <Link className="tm-mt-lg tm-button-secondary" to="/about">
          {t("settings.application.action")}
        </Link>
      </section>
    </div>
  );
}
