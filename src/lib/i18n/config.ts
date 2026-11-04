export const LOCALES = ["en", "ru", "kk"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie name used on the server and read by client JS. */
export const LOCALE_COOKIE = "nomad_locale";

/** Cookie storage key for client-side localStorage sync. */
export const LOCALE_STORAGE_KEY = "nomad-locale";

export const LOCALE_META: Record<Locale, { label: string; english: string; htmlLang: string }> = {
  en: { label: "English", english: "English", htmlLang: "en" },
  ru: { label: "Русский", english: "Russian", htmlLang: "ru" },
  kk: { label: "Қазақша", english: "Kazakh", htmlLang: "kk" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}