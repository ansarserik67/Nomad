import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { getAuthContext } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { viewer, configured } = await getAuthContext();
  if (configured && viewer) redirect("/dashboard");

  return <AuthShell>{children}</AuthShell>;
}
