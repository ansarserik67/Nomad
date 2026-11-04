import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/forms";
import { AuthNotice } from "@/components/auth/auth-notice";
import { getAuthContext } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const [{ t }, { configured, viewer }] = await Promise.all([
    getServerDictionary(),
    getAuthContext(),
  ]);

  if (configured && !viewer) {
    return (
      <div className="space-y-5">
        <div>
          <p className="label-eyebrow mb-2.5">{t.auth.accountRecovery}</p>
          <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em]">
            {t.auth.resetPasswordTitle}
          </h1>
        </div>
        <AuthNotice
          status="error"
          message={t.messages["Your reset link has expired. Request a new one to continue."]}
        />
        <Link
          href="/forgot-password"
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-on-accent transition-colors hover:bg-accent-soft"
        >
          {t.auth.requestNewLink}
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm configured={configured} />;
}
