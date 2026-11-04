"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  LOCALE_COOKIE,
  LOCALE_META,
  LOCALE_STORAGE_KEY,
  LOCALES,
  isLocale,
  type Locale,
} from "./config";
import { getDictionary, type Dictionary } from "./dictionaries";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** The entire dictionary for the active locale. */
  t: Dictionary;
  locales: readonly Locale[];
  /** Translates a fixed English sentence returned by a server action or Zod. */
  translate: (message: string | undefined) => string | undefined;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function persistLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage can be unavailable (private mode); the cookie still works.
  }
}

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? "en");

  // First load without a cookie: adopt the browser language once and write it
  // down, so the resolved language is stable on every later request.
  useEffect(() => {
    const hasCookie = document.cookie
      .split("; ")
      .some((entry) => entry.startsWith(`${LOCALE_COOKIE}=`));
    if (hasCookie) return;

    if (initialLocale) {
      persistLocaleCookie(initialLocale);
      return;
    }

    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      stored = null;
    }
    const candidate = stored ?? navigator.language?.split("-")[0] ?? "en";
    if (!isLocale(candidate)) return;
    setLocaleState(candidate);
    persistLocaleCookie(candidate);
  }, [initialLocale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (!isLocale(next) || next === locale) return;
      setLocaleState(next);
      persistLocaleCookie(next);
      document.documentElement.lang = LOCALE_META[next].htmlLang;
      // Server components read the cookie, so refresh them to pick the new
      // language up. Client components already re-rendered through context.
      startTransition(() => router.refresh());
    },
    [locale, router],
  );

  const value = useMemo<I18nContextValue>(() => {
    const t = getDictionary(locale);
    return {
      locale,
      setLocale,
      t,
      locales: LOCALES,
      translate: (message) =>
        message ? (t.messages[message] ?? message) : message,
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }
  return context;
}

/** Convenience hook for components that only need the current locale. */
export function useLocale() {
  const { locale, setLocale, locales } = useI18n();
  return { locale, setLocale, locales };
}
