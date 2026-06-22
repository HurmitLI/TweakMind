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
      <h3 className="tm-section-title">{title}</h3>
      <p className="mt-2 max-w-2xl tm-body-secondary">{description}</p>
      <div className="mt-5">{children}</div>
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
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            className={[
              "h-9 tm-chip",
              isSelected ? "tm-chip-active" : ""
            ].join(" ")}
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
    <a
      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 transition hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
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
    <div className="tm-page">
      <section className="tm-hero">
        <p className="tm-eyebrow">{t("settings.eyebrow")}</p>
        <h2 className="tm-title">{t("settings.title")}</h2>
        <p className="tm-subtitle">{t("settings.subtitle")}</p>
      </section>

      <div className="rounded-xl bg-white/95 px-7 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:bg-slate-900/95">
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

      <section className="tm-about-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="tm-eyebrow">{t("settings.application.title")}</p>
            <h3 className="tm-title">{AppInfo.name}</h3>
            <p className="mt-3 max-w-2xl tm-body-secondary">{t("settings.application.description")}</p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-400/90 text-slate-950 dark:bg-emerald-500">
            <Sparkles size={24} aria-hidden="true" />
          </div>
        </div>

        <dl className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="tm-field-plain">
            <dt className="tm-label">{t("settings.application.version")}</dt>
            <dd className="tm-value">{t("app.versionLabel", { version: AppInfo.version })}</dd>
          </div>
          <div className="tm-field-plain">
            <dt className="tm-label">{t("settings.application.license")}</dt>
            <dd className="tm-value">{AppInfo.licenseName}</dd>
          </div>
          <div className="tm-field-plain">
            <dt className="tm-label">{t("settings.application.repository")}</dt>
            <dd className="mt-1.5">
              <ApplicationLink href={AppInfo.repositoryUrl} label={AppInfo.repositoryUrl.replace("https://", "")} />
            </dd>
          </div>
          <div className="tm-field-plain">
            <dt className="tm-label">{t("settings.application.issueTracker")}</dt>
            <dd className="mt-1.5">
              <ApplicationLink href={AppInfo.issueTrackerUrl} label={AppInfo.issueTrackerUrl.replace("https://", "")} />
            </dd>
          </div>
        </dl>
        <Link
          className="mt-6 tm-button-secondary"
          to="/about"
        >
          {t("settings.application.action")}
        </Link>
      </section>
    </div>
  );
}
