import "server-only";

import { cookies, headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_META,
  isLocale,
  type Locale,
} from "./config";
import { getDictionary, type Dictionary } from "./dictionaries";

/** Picks the first supported language from an Accept-Language header. */
function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, quality] = part.trim().split(";q=");
      return {
        tag: tag?.trim().toLowerCase() ?? "",
        quality: quality ? Number.parseFloat(quality) : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}

/**
 * Resolves the interface language for the current request. A cookie (explicit
 * user choice) always wins; otherwise the browser's Accept-Language decides.
 */
export async function initLocale(): Promise<Locale> {
  try {
    const value = (await cookies()).get(LOCALE_COOKIE)?.value;
    if (value && isLocale(value)) return value;
  } catch {
    // cookies() is unavailable outside a request scope.
  }

  try {
    const header = (await headers()).get("accept-language");
    const preferred = fromAcceptLanguage(header);
    if (preferred) return preferred;
  } catch {
    // headers() is unavailable outside a request scope.
  }

  return DEFAULT_LOCALE;
}

/** Resolves the dictionary for the current request in one call. */
export async function getServerDictionary(): Promise<{
  locale: Locale;
  t: Dictionary;
  htmlLang: string;
}> {
  const locale = await initLocale();
  return { locale, t: getDictionary(locale), htmlLang: LOCALE_META[locale].htmlLang };
}

/** Translates a fixed English sentence using the request locale. */
export async function translateMessage(message: string): Promise<string> {
  const locale = await initLocale();
  return getDictionary(locale).messages[message] ?? message;
}

/** Translates every field error produced by a Zod schema. */
export async function translateFieldErrors(
  errors: Record<string, string>,
): Promise<Record<string, string>> {
  const locale = await initLocale();
  const messages = getDictionary(locale).messages;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    result[key] = messages[value] ?? value;
  }
  return result;
}

export { LOCALES, DEFAULT_LOCALE };
