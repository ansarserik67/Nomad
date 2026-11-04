import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { Profile } from "@/lib/database.types";
import {
  getSupabaseServerClient,
  type ServerSupabaseClient,
} from "@/lib/supabase/server";

export type Viewer = {
  id: string;
  email: string;
  profile: Profile | null;
  displayName: string;
  firstName: string;
  /** Primary sign-in method reported by Supabase, e.g. "google" or "email". */
  provider: string;
  /** True when a Google identity is linked to this account. */
  hasGoogle: boolean;
};

export type AuthContext = {
  supabase: ServerSupabaseClient | null;
  viewer: Viewer | null;
  configured: boolean;
};

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { supabase: null, viewer: null, configured: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, viewer: null, configured: true };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const email = user.email ?? profile?.email ?? "";
  const displayName = profile?.full_name?.trim() || email.split("@")[0] || "Traveller";
  const firstName = displayName.split(/\s+/)[0] ?? displayName;

  // Supabase records every linked identity; the primary provider is also in
  // app_metadata. Reading both keeps Google status correct for email accounts
  // that later linked Google, and for Google-first accounts.
  const providers = Array.isArray(user.identities)
    ? user.identities
        .map((identity) => identity.provider)
        .filter((value): value is string => typeof value === "string")
    : [];
  const primary = user.app_metadata?.provider;
  const provider =
    typeof primary === "string" ? primary : (providers[0] ?? "email");
  const hasGoogle = provider === "google" || providers.includes("google");

  return {
    supabase,
    configured: true,
    viewer: {
      id: user.id,
      email,
      profile: profile ?? null,
      displayName,
      firstName,
      provider,
      hasGoogle,
    },
  };
});

export async function requireAuth(): Promise<{
  supabase: ServerSupabaseClient;
  viewer: Viewer;
}> {
  const context = await getAuthContext();
  if (!context.configured) redirect("/login");
  if (!context.viewer || !context.supabase) redirect("/login");
  return { supabase: context.supabase, viewer: context.viewer };
}

export function hasProfileTriggerWarning(context: AuthContext) {
  return Boolean(context.viewer && !context.viewer.profile);
}
