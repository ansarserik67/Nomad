"use client";

import { ArrowRight, CalendarDays, Plus, Users, Wallet } from "lucide-react";
import Link from "next/link";

import { DestinationArtwork } from "@/components/dashboard/destination-artwork";
import { Badge, TripStatusBadge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/primitives";
import type { TripSummary } from "@/lib/data/trips";
import { format } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";
import { clamp, formatDateRange, formatMoney, nightsBetween } from "@/lib/utils";

export function UpcomingTripCard({ trip }: { trip: TripSummary | null }) {
  const { t, locale } = useI18n();

  if (!trip) {
    return (
      <GlassCard className="relative flex min-h-[290px] flex-col justify-between overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-[radial-gradient(circle,rgba(139,157,255,0.16),transparent_65%)] blur-2xl" />
        <div>
          <p className="label-eyebrow">{t.dashboard.upcomingTrip}</p>
          <h2 className="mt-3 font-display text-[23px] font-semibold tracking-[-0.03em]">
            {t.dashboard.nextJourneyStarts}
          </h2>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
            {t.dashboard.nextJourneyDescription}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href="/planner"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[13px] font-medium text-on-accent transition-colors hover:bg-accent-soft"
          >
            <Plus className="size-4" /> {t.dashboard.planTrip}
          </Link>
          <Link
            href="/discover"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-4 text-[13px] font-medium text-paper transition-colors hover:bg-surface-3"
          >
            {t.dashboard.findInspiration} <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </GlassCard>
    );
  }

  const budget = Number(trip.budget_amount);
  const spent = trip.spent;
  const used = budget > 0 ? clamp((spent / budget) * 100) : 0;
  const remaining = Math.max(budget - spent, 0);
  const nights = nightsBetween(trip.start_date, trip.end_date);
  const nightsLabel =
    nights === 1
      ? format(t.dashboard.nightsOne, { count: nights })
      : format(t.dashboard.nights, { count: nights });
  const travellersLabel =
    trip.travelers === 1
      ? format(t.dashboard.travellersOne, { count: trip.travelers })
      : format(t.dashboard.travellers, { count: trip.travelers });

  return (
    <GlassCard className="relative overflow-hidden p-0">
      <DestinationArtwork
        hue={trip.cover_hue}
        countryCode={trip.destination_country_code}
        watermark={false}
        className="pointer-events-none absolute inset-0 opacity-90"
      />
      <div className="relative z-10 flex min-h-[290px] flex-col justify-between p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TripStatusBadge status={trip.phase} />
            {trip.daysUntilStart !== null && trip.daysUntilStart >= 0 && trip.daysUntilStart <= 365 ? (
              <Badge tone="neutral">
                {trip.daysUntilStart === 0
                  ? t.dashboard.departsToday
                  : trip.daysUntilStart === 1
                    ? format(t.dashboard.inDaysOne, { days: trip.daysUntilStart })
                    : format(t.dashboard.inDays, { days: trip.daysUntilStart })}
              </Badge>
            ) : null}
          </div>
          <Link
            href={`/trips/${trip.id}`}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-ink/40 px-3 py-1.5 text-[11px] font-medium text-paper backdrop-blur-md transition-colors hover:bg-ink/65"
          >
            {t.dashboard.openTrip} <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
            {trip.destination_country}
          </p>
          <h2 className="mt-1.5 font-display text-[32px] font-semibold leading-none tracking-[-0.04em] text-white drop-shadow-sm sm:text-[38px]">
            {trip.destination_city}
          </h2>
          <p className="mt-3 max-w-md text-[12.5px] leading-relaxed text-white/70">
            {trip.title}
            {nights > 0 ? ` · ${nightsLabel}` : ""}
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {formatDateRange(trip.start_date, trip.end_date, locale)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" />
                {travellersLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="size-3.5" />
                {format(t.dashboard.budget, {
                  amount: formatMoney(budget, trip.currency, { compact: true }, locale),
                })}
              </span>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[10.5px] text-white/65">
                <span>
                  {format(t.dashboard.spentLeft, {
                    spent: formatMoney(spent, trip.currency, {}, locale),
                    left: formatMoney(remaining, trip.currency, {}, locale),
                  })}
                </span>
                <span className="font-medium text-white">{Math.round(used)}%</span>
              </div>
              <Progress
                value={used}
                tone={used >= 90 ? "danger" : used >= 70 ? "warning" : "teal"}
                label={t.dashboard.tripBudgetUsed}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <span className="text-[10.5px] text-white/60">
              {format(t.dashboard.planned, { count: trip.itineraryCount })}
            </span>
            <span className="h-3 w-px bg-surface-3" />
            <span className="text-[10.5px] text-white/60">
              {format(t.dashboard.filed, { count: trip.documentCount })}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
