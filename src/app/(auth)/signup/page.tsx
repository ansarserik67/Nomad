import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/forms";
import { getAuthContext } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { configured, viewer } = await getAuthContext();
  const { next } = await searchParams;

  // Already signed in — send the traveller straight to their destination.
  if (viewer) redirect(safeNextPath(next));

  return <SignupForm configured={configured} next={safeNextPath(next)} />;
}
