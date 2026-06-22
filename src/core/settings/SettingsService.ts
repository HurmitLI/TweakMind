import type { KnowledgeTerminology, OptimizationKnowledge } from "../knowledge/KnowledgeDefinition";
import { LocalizationService } from "../localization/LocalizationService";

export type AppLanguage = "en" | "zh-CN";
export type AppTheme = "system" | "light" | "dark";
export type TerminologyMode = "original" | "localized" | "tweakmind";

export interface AppSettings {
  language: AppLanguage;
  theme: AppTheme;
  terminologyMode: TerminologyMode;
}

const settingsStorageKey = "tweakmind:app-settings";

const defaultSettings: AppSettings = {
  language: "en",
  theme: "system",
  terminologyMode: "original"
};

type SettingsListener = (settings: AppSettings) => void;

function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "en" || value === "zh-CN";
}

function isAppTheme(value: unknown): value is AppTheme {
  return value === "system" || value === "light" || value === "dark";
}

function isTerminologyMode(value: unknown): value is TerminologyMode {
  return value === "original" || value === "localized" || value === "tweakmind";
}

function readStoredSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(settingsStorageKey);

    if (!raw) {
      return { ...defaultSettings };
    }

    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    return {
      language: isAppLanguage(parsed.language) ? parsed.language : defaultSettings.language,
      theme: isAppTheme(parsed.theme) ? parsed.theme : defaultSettings.theme,
      terminologyMode: isTerminologyMode(parsed.terminologyMode)
        ? parsed.terminologyMode
        : defaultSettings.terminologyMode
    };
  } catch {
    return { ...defaultSettings };
  }
}

function persistSettings(settings: AppSettings): void {
  window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
}

function resolveSystemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveEffectiveTheme(theme: AppTheme): "light" | "dark" {
  if (theme === "dark") {
    return "dark";
  }

  if (theme === "light") {
    return "light";
  }

  return resolveSystemPrefersDark() ? "dark" : "light";
}

export class SettingsService {
  private static settings: AppSettings = readStoredSettings();
  private static listeners = new Set<SettingsListener>();
  private static initialized = false;
  private static systemThemeListener: ((event: MediaQueryListEvent) => void) | null = null;

  static getSettings(): AppSettings {
    return { ...this.settings };
  }

  static updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.settings = {
      ...this.settings,
      ...partial
    };

    persistSettings(this.settings);
    this.applySettings(this.settings);
    this.notifyListeners();

    return this.getSettings();
  }

  static subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  static initialize(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.settings = readStoredSettings();
    this.applySettings(this.settings);
    this.attachSystemThemeListener();
  }

  static resolveTerminologyLabel(
    terminology: KnowledgeTerminology,
    mode: TerminologyMode = this.settings.terminologyMode
  ): string {
    switch (mode) {
      case "localized":
        return terminology.localized.trim() || terminology.original;
      case "tweakmind":
        return terminology.tweakmind.replace(/\n+/g, " ").trim() || terminology.original;
      default:
        return terminology.original.trim() || terminology.localized;
    }
  }

  static resolveKnowledgeTitle(knowledge: OptimizationKnowledge, mode?: TerminologyMode): string {
    const label = this.resolveTerminologyLabel(knowledge.terminology, mode);

    if (label) {
      return label;
    }

    return knowledge.identity.title;
  }

  private static applySettings(settings: AppSettings): void {
    this.applyLanguage(settings.language);
    this.applyTheme(settings.theme);
  }

  private static applyLanguage(language: AppLanguage): void {
    document.documentElement.lang = language === "zh-CN" ? "zh-CN" : "en";
    LocalizationService.translate("app.name");
  }

  private static applyTheme(theme: AppTheme): void {
    const effectiveTheme = resolveEffectiveTheme(theme);
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.classList.toggle("dark", effectiveTheme === "dark");
  }

  private static attachSystemThemeListener(): void {
    if (this.systemThemeListener) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    this.systemThemeListener = () => {
      if (this.settings.theme === "system") {
        this.applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", this.systemThemeListener);
  }

  private static notifyListeners(): void {
    const snapshot = this.getSettings();

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
