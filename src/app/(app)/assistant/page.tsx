import type { Metadata } from "next";
import { Bot, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { AssistantWorkspace } from "@/components/assistant/assistant-workspace";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/primitives";
import { getServerDictionary } from "@/lib/i18n/server";
import { getAiQuota } from "@/lib/ai/quota";
import { getAuthContext } from "@/lib/auth";
import { getTripSummaries } from "@/lib/data/trips";
import { isAiConfigured } from "@/lib/env.server";

export const metadata: Metadata = { title: "AI Assistant" };
export const dynamic = "force-dynamic";

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string }>;
}) {
  const [{ t }, { supabase, viewer, configured }] = await Promise.all([
    getServerDictionary(),
    getAuthContext(),
  ]);
  const { trip } = await searchParams;

  const [trips, quota] = await Promise.all([
    supabase && viewer ? getTripSummaries(supabase, viewer.id) : Promise.resolve([]),
    supabase && viewer ? getAiQuota(supabase).catch(() => null) : Promise.resolve(null),
  ]);

  const available = Boolean(configured && viewer && isAiConfigured);
  const unavailableReason = !configured
    ? "NOMAD's backend is not connected. Add your Supabase project keys to give the assistant trip context and quota enforcement."
    : !viewer
      ? "Sign in to use the assistant and its five free daily operations."
      : "The server is missing GEMINI_API_KEY. Add it to .env.local and restart the app.";

  return (
    <div>
      <PageHeader
        eyebrow={t.pages.assistant.eyebrow}
        title={t.pages.assistant.title}
        description={t.pages.assistant.description}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-1 px-3 py-1.5 text-[10.5px] text-muted">
            <Sparkles className="size-3 text-accent" />
            {quota ? `${quota.remaining} left today` : "5 per day"}
          </span>
        }
      />

      {!available ? (
        <GlassCard className="mt-6">
          <div className="mx-auto max-w-xl py-8 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-[16px] border border-warning/20 bg-warning/10 text-warning">
              <TriangleAlert className="size-5" />
            </span>
            <h2 className="mt-4 font-display text-[20px] font-semibold">
              The assistant is not available yet
            </h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{unavailableReason}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/setup"
                className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-[12.5px] font-medium text-on-accent transition-colors hover:bg-accent-soft"
              >
                Review setup
              </Link>
              {configured && !viewer ? (
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center rounded-full border border-line bg-surface-2 px-4 text-[12.5px] font-medium text-paper transition-colors hover:bg-surface-3"
                >
                  Sign in
                </Link>
              ) : null}
            </div>
          </div>
        </GlassCard>
      ) : (
        <div className="mt-6">
          <AssistantWorkspace
            trips={trips.map((item) => ({
              id: item.id,
              title: item.title,
              city: item.destination_city,
              country: item.destination_country,
              startDate: item.start_date,
              endDate: item.end_date,
              currency: item.currency,
            }))}
            initialTripId={trip && trips.some((item) => item.id === trip) ? trip : undefined}
            initialQuota={quota}
          />
        </div>
      )}

      {available ? (
        <GlassCard className="mt-4" tone="subtle">
          <div className="flex items-start gap-3">
            <Bot className="mt-0.5 size-4 shrink-0 text-accent" />
            <p className="text-[11px] leading-relaxed text-muted-2">
              NOMAD sends only the trip context shown in the panel to Google Gemini. Prompts and
              replies are not stored in your database beyond usage counters. Failed requests
              are released from your quota automatically.
            </p>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
