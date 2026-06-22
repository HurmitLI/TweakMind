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
    <section className="rounded-lg border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
      <h3 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
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
              "h-9 rounded-full border px-4 text-sm font-semibold transition",
              isSelected
                ? "border-blue-200 bg-blue-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
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
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-lg border border-white/70 bg-white/85 px-8 py-8 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/85">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">{t("settings.eyebrow")}</p>
        <h2 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{t("settings.title")}</h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">{t("settings.subtitle")}</p>
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
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
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
          className="mt-4 inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
          to="/about"
        >
          {t("settings.application.action")}
        </Link>
      </PreferenceSection>
    </div>
  );
}
