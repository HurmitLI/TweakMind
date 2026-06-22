import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppInfo } from "../app/AppInfo";
import { LocalizationService, type TranslationParams } from "./LocalizationService";
import type { TranslationKey } from "./messages";
import { useSettings } from "../settings/SettingsProvider";
import type { AppLanguage } from "../settings/SettingsService";

interface LanguageContextValue {
  language: AppLanguage;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [, setLanguageVersion] = useState(settings.language);

  useEffect(() => LocalizationService.subscribe(() => setLanguageVersion(LocalizationService.getLanguage())), []);

  useEffect(() => {
    document.title = LocalizationService.translate("app.windowTitle", { version: AppInfo.version });
  }, [settings.language]);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => LocalizationService.translate(key, params),
    []
  );

  const value = useMemo(
    () => ({
      language: settings.language,
      t
    }),
    [settings.language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useTranslation must be used within LanguageProvider.");
  }

  return context;
}
