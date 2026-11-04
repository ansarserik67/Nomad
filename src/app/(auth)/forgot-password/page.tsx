import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forms";
import { getAuthContext } from "@/lib/auth";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage() {
  const { configured } = await getAuthContext();
  return <ForgotPasswordForm configured={configured} />;
}
