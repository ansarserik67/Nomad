"use client";

/**
 * There is one theme implementation in the app (`@/lib/theme-provider`).
 * This module only re-exports it so older imports keep working.
 */
export { ThemeProvider, useTheme } from "@/lib/theme-provider";
