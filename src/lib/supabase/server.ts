import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env";

export type ServerSupabaseClient = SupabaseClient<Database>;

export class BackendNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    );
    this.name = "BackendNotConfiguredError";
  }
}

/** Null when Supabase is not configured, so pages can render setup states. */
export async function getSupabaseServerClient(): Promise<ServerSupabaseClient | null> {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component render: session refresh is handled
          // by middleware instead, so this is safe to ignore.
        }
      },
    },
  });
}

export async function requireSupabaseServerClient(): Promise<ServerSupabaseClient> {
  const client = await getSupabaseServerClient();
  if (!client) throw new BackendNotConfiguredError();
  return client;
}
