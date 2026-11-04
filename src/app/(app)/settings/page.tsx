import type { Metadata } from "next";
import {
  CheckCircle2,
  CircleDashed,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { PreferencesCard } from "@/components/settings/preferences-card";
import { ProfileForm } from "@/components/settings/profile-form";
import { Badge } from "@/components/ui/badge";
import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { Avatar, PageHeader } from "@/components/ui/primitives";
import { getAiQuota } from "@/lib/ai/quota";
import { getAuthContext } from "@/lib/auth";
import { isMapboxConfigured } from "@/lib/env";
import { isAiConfigured } from "@/lib/env.server";
import { getServerDictionary } from "@/lib/i18n/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [{ t }, { supabase, viewer, configured }] = await Promise.all([
    getServerDictionary(),
    getAuthContext(),
  ]);
  const quota = supabase && viewer ? await getAiQuota(supabase).catch(() => null) : null;

  const services = [
    { name: "Supabase", detail: t.settings.connectedServicesDescription, connected: configured },
    { name: "Google Gemini", detail: "NOMAD AI", connected: isAiConfigured },
    { name: "Mapbox", detail: t.pages.places.eyebrow, connected: isMapboxConfigured },
    { name: "Frankfurter", detail: t.common.currency, connected: true },
  ];

  const signInMethod = viewer
    ? viewer.hasGoogle
      ? t.settings.googleConnected
      : t.settings.emailPassword
    : t.settings.notConnected;

  return (
    <div>
      <PageHeader
        eyebrow={t.settings.eyebrow}
        title={t.settings.title}
        description={t.settings.description}
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <PreferencesCard />

          <GlassCard>
            <CardHeader
              eyebrow={t.settings.profile}
              title={t.settings.travellerDetails}
              description={t.settings.travellerDescription}
            />
            {configured && viewer ? (
              <div className="mt-5">
                <ProfileForm profile={viewer.profile} />
              </div>
            ) : (
              <div className="mt-5 rounded-[14px] border border-warning/25 bg-warning/[0.06] px-3.5 py-3 text-[12px] leading-relaxed text-warning">
                {configured ? t.settings.signInToEdit : t.settings.connectSupabaseProfile}
                <div className="mt-2">
                  <Link
                    href={configured ? "/login" : "/setup"}
                    className="font-medium underline"
                  >
                    {configured ? t.auth.signIn : t.settings.openSetup}
                  </Link>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        <div className="space-y-4">
          <GlassCard>
            <CardHeader eyebrow={t.settings.account} title={t.settings.accountDescription} />
            <div className="mt-4 flex items-center gap-3">
              <Avatar
                name={viewer?.displayName}
                email={viewer?.email}
                src={viewer?.profile?.avatar_url}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-paper">
                  {viewer?.displayName ?? t.settings.guestPreview}
                </p>
                <p className="truncate text-[11px] text-muted-2">
                  {viewer?.email ?? t.settings.noActiveSession}
                </p>
                {viewer?.profile?.created_at ? (
                  <p className="mt-1 text-[10px] text-muted-2">
                    {t.settings.memberSince}{" "}
                    {formatDate(viewer.profile.created_at, {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                ) : null}
              </div>
              <Badge tone="accent" className="ml-auto">
                {t.settings.freePlan}
              </Badge>
            </div>

            <div className="mt-4 space-y-2 border-t border-line pt-4 text-[11.5px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-2">{t.settings.signInMethod}</span>
                <span className="truncate text-paper">{signInMethod}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-2">{t.settings.googleStatus}</span>
                <span
                  className={
                    viewer?.hasGoogle ? "text-positive" : "text-muted-2"
                  }
                >
                  {viewer?.hasGoogle ? t.settings.linked : t.settings.notLinked}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-2">{t.settings.aiOperationsToday}</span>
                <span className="text-paper">
                  {quota ? `${quota.used} / ${quota.limit}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-2">{t.settings.quotaResets}</span>
                <span className="text-paper">00:00 UTC</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-2">{t.settings.homeCurrency}</span>
                <span className="text-paper">{viewer?.profile?.home_currency ?? "USD"}</span>
              </div>
            </div>

            {viewer ? (
              <form action="/auth/signout" method="post" className="mt-4">
                <button
                  type="submit"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3.5 text-[11.5px] font-medium text-muted transition-colors hover:border-danger/25 hover:text-danger"
                >
                  <LogOut className="size-3.5" /> {t.settings.signOut}
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="mt-4 inline-flex h-9 items-center rounded-full bg-accent px-3.5 text-[11.5px] font-medium text-on-accent"
              >
                {t.auth.signIn}
              </Link>
            )}
          </GlassCard>

          <GlassCard>
            <CardHeader
              eyebrow={t.settings.connectedServices}
              title={t.settings.connectedServicesDescription}
              action={
                <Link
                  href="/setup"
                  className="text-[10.5px] text-muted-2 hover:text-paper"
                >
                  {t.settings.setup}
                </Link>
              }
            />
            <ul className="mt-3 space-y-2">
              {services.map((service) => (
                <li
                  key={service.name}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface-1 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-paper">{service.name}</p>
                    <p className="truncate text-[10px] text-muted-2">{service.detail}</p>
                  </div>
                  {service.connected ? (
                    <CheckCircle2
                      className="size-4 shrink-0 text-positive"
                      aria-label={t.settings.connected}
                    />
                  ) : (
                    <CircleDashed
                      className="size-4 shrink-0 text-muted-2"
                      aria-label={t.settings.notConnected}
                    />
                  )}
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard tone="subtle">
            <p className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-2">
              <ShieldCheck className="size-3.5" /> {t.settings.security}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              {t.settings.securityDescription}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-2">
              <Sparkles className="size-3 text-accent" /> {t.settings.freePlanNote}
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
