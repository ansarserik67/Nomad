export const THEMES = ["light", "dark", "system"] as const;

export type Theme = (typeof THEMES)[number];

/** Cookie is read on the server so the first paint already has the right theme. */
export const THEME_COOKIE = "nomad_theme";
export const THEME_STORAGE_KEY = "nomad-theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/** The theme actually painted: "system" resolves through the media query. */
export type ResolvedTheme = "light" | "dark";

export function resolveTheme(theme: Theme, prefersLight: boolean): ResolvedTheme {
  if (theme === "system") return prefersLight ? "light" : "dark";
  return theme;
}
