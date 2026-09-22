import { english } from "@/data/en";
export type MessageKey = keyof typeof english;
export type Locale = "en";
export const messages = { en: english };
export function uiText(key: MessageKey, locale: Locale = "en"): string {
  return messages[locale][key];
}
