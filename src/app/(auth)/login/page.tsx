import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/forms";
import { getAuthContext } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { configured, viewer } = await getAuthContext();
  const { next, error } = await searchParams;

  // An authenticated traveller never needs the sign-in form.
  if (viewer) redirect(safeNextPath(next));

  const notice =
    error === "link"
      ? "That sign-in link is invalid or has expired. Request a new one and try again."
      : error === "missing"
        ? "The sign-in link was incomplete. Please try again."
        : error === "oauth"
          ? "Google sign-in could not be started. Check that the Google provider is enabled in Supabase."
          : error === "config"
            ? "Supabase is not connected yet. Add your project keys to .env.local."
            : undefined;

  return (
    <LoginForm configured={configured} next={safeNextPath(next)} notice={notice} />
  );
}
