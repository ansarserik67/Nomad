"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  THEME_COOKIE,
  THEME_STORAGE_KEY,
  isTheme,
  type ResolvedTheme,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  /** The stored preference: light, dark or system. */
  theme: Theme;
  /** What is actually painted right now. */
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersLight(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  );
}

function resolve(preference: Theme): ResolvedTheme {
  if (preference === "system") return systemPrefersLight() ? "light" : "dark";
  return preference;
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

function persistTheme(theme: Theme) {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The cookie is enough when storage is blocked.
  }
}

export function ThemeProvider({
  initialTheme = "system",
  children,
}: {
  initialTheme?: Theme;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  // Deterministic on the server: the inline script already painted the real
  // "system" result, and this updates to it right after hydration.
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    initialTheme === "light" ? "light" : "dark",
  );

  // Keep the paint in sync with the stored preference.
  useEffect(() => {
    const next = resolve(theme);
    setResolved(next);
    applyTheme(next);
  }, [theme]);

  // "System" must follow the device live, not only at load time.
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const next: ResolvedTheme = media.matches ? "light" : "dark";
      setResolved(next);
      applyTheme(next);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  // If there was no cookie, adopt a value chosen previously in this browser.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored && isTheme(stored) && stored !== theme) {
      setThemeState(stored);
      persistTheme(stored);
    }
    // Only on first mount: later changes come from setTheme.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback((next: Theme) => {
    if (!isTheme(next)) return;
    setThemeState(next);
    persistTheme(next);
    const nextResolved = resolve(next);
    setResolved(nextResolved);
    applyTheme(nextResolved);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolved, setTheme }),
    [theme, resolved, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return context;
}
