import "server-only";

import { isMapboxConfigured, isSupabaseConfigured } from "@/lib/env";

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Google Gemini key. Server-only: this module is guarded by `server-only`, so
 * the value can never be bundled into client JavaScript.
 *
 * `OPENAI_API_KEY` is still read as a legacy fallback because earlier builds
 * stored a Google-format key there. The value itself is never logged — only the
 * fact that the legacy variable is in use.
 */
const primaryGeminiKey = clean(process.env.GEMINI_API_KEY);
const legacyKey = clean(process.env.OPENAI_API_KEY);

export const geminiApiKey = primaryGeminiKey ?? legacyKey;
export const isGeminiConfigured = Boolean(geminiApiKey);
export const usesLegacyKeyVariable = !primaryGeminiKey && Boolean(legacyKey);

/**
 * Requested model. This is only a preference: the Gemini API decides what a
 * given key may call, so the AI module falls back through a verified list when
 * a model is retired (the API answers 404 for those).
 */
export const geminiModel = clean(process.env.GEMINI_MODEL) ?? "gemini-1.5-flash";

/** Kept as an alias so pages do not need to know the provider name. */
export const isAiConfigured = isGeminiConfigured;

export const featureState = {
  supabase: isSupabaseConfigured,
  mapbox: isMapboxConfigured,
  ai: isAiConfigured,
  fx: true,
} as const;
