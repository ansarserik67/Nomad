import "server-only";

import { cookies } from "next/headers";

import { THEME_COOKIE, isTheme, type Theme } from "./theme";

/**
 * The stored theme preference ("light" | "dark" | "system").
 *
 * "system" is resolved in the browser by the inline anti-flash script before
 * the first paint, because only the client knows `prefers-color-scheme`.
 */
export async function initThemePreference(): Promise<Theme> {
  try {
    const value = (await cookies()).get(THEME_COOKIE)?.value;
    if (value && isTheme(value)) return value;
  } catch {
    // cookies() is unavailable outside a request scope.
  }
  return "system";
}
