import { ar } from "@/lib/i18n/dictionaries/ar";
import { en } from "@/lib/i18n/dictionaries/en";

export const dictionaries = { ar, en };

export type Locale = keyof typeof dictionaries;
export type Dictionary = (typeof dictionaries)[Locale];

export const supportedLocales: Locale[] = ["ar", "en"];

export function normalizeLocale(value?: string | null): Locale {
  if (!value) return "ar";
  return value === "en" ? "en" : "ar";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
