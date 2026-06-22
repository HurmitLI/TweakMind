import type { AppLanguage } from "../settings/SettingsService";
import { SettingsService } from "../settings/SettingsService";
import { localizationMessages, type TranslationKey } from "./messages";

export type TranslationParams = Record<string, string | number>;

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export class LocalizationService {
  static getLanguage(): AppLanguage {
    return SettingsService.getSettings().language;
  }

  static translate(key: TranslationKey, params?: TranslationParams): string {
    const language = this.getLanguage();
    const bundle = localizationMessages[language] ?? localizationMessages.en;
    const template = bundle[key] ?? localizationMessages.en[key] ?? key;

    return interpolate(template, params);
  }

  static subscribe(listener: (language: AppLanguage) => void): () => void {
    return SettingsService.subscribe((settings) => listener(settings.language));
  }
}

export function translateEnumValue(prefix: string, value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "").replace(/\//g, "");
  const key = `${prefix}.${normalized}` as TranslationKey;
  const translated = LocalizationService.translate(key);

  return translated === key ? value : translated;
}
