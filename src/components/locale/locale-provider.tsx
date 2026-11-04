"use client";

/**
 * There is one locale implementation in the app (`@/lib/i18n/provider`).
 * This module only re-exports it so older imports keep working.
 */
export { I18nProvider, useI18n, useLocale } from "@/lib/i18n/provider";
