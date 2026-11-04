/**
 * Public configuration. Only NEXT_PUBLIC_* values belong here — this module
 * is imported by client components, so it must never touch server secrets.
 */

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const mapboxToken =
  clean(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) ??
  clean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
export const appUrl = clean(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isMapboxConfigured = Boolean(mapboxToken);

/** Server-only features are reported through /api/system/status. */
export type FeatureState = {
  supabase: boolean;
  mapbox: boolean;
  ai: boolean;
  fx: boolean;
};
