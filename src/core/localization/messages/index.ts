import type { AppLanguage } from "../../settings/SettingsService";
import { enMessages } from "./en";
import { zhCNMessages } from "./zh-CN";

export const localizationMessages = {
  en: enMessages,
  "zh-CN": zhCNMessages
} satisfies Record<AppLanguage, Record<keyof typeof enMessages, string>>;

export { enMessages, zhCNMessages };
export type { TranslationKey } from "./en";
