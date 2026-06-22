import type { ReactNode } from "react";
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
    <section className="tm-panel">
      <h3 className="tm-section-title">{title}</h3>
      <p className="mt-2 max-w-2xl tm-body">{description}</p>
      <div className="mt-4">{children}</div>
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

      <PreferenceSection description={t("settings.application.description")} title={t("settings.application.title")}>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {AppInfo.name} {t("app.versionLabel", { version: AppInfo.version })}
        </p>
        <Link
          className="mt-4 tm-button-secondary"
          to="/about"
        >
          {t("settings.application.action")}
        </Link>
      </PreferenceSection>
    </div>
  );
}
