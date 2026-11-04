"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env";

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Returns null when the project has not been connected yet. */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;
  if (!cached) {
    cached = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return cached;
}
