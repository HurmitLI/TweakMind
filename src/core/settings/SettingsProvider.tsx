import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SettingsService, type AppSettings } from "./SettingsService";

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => AppSettings;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(() => SettingsService.getSettings());

  useEffect(() => {
    SettingsService.initialize();

    return SettingsService.subscribe(setSettings);
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => SettingsService.updateSettings(partial), []);

  const value = useMemo(
    () => ({
      settings,
      updateSettings
    }),
    [settings, updateSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider.");
  }

  return context;
}
