import type { Metadata } from "next";
import { ArrowUpRight, CalendarRange, Sparkles } from "lucide-react";
import Link from "next/link";

import { DestinationArtwork } from "@/components/dashboard/destination-artwork";
import { TripForm, type TripDefaults } from "@/components/trips/trip-form";
import { Badge, TripStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/primitives";
import { getServerDictionary } from "@/lib/i18n/server";
import { getAuthContext } from "@/lib/auth";
import { getTripSummaries } from "@/lib/data/trips";
import { DESTINATIONS } from "@/lib/destinations";
import { formatDateRange } from "@/lib/utils";

export const metadata: Metadata = { title: "Trip Planner" };
export const dynamic = "force-dynamic";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const [{ t }, { supabase, viewer, configured }] = await Promise.all([
    getServerDictionary(),
    getAuthContext(),
  ]);
  const { destination: destinationId } = await searchParams;
  const preset = destinationId
    ? DESTINATIONS.find((destination) => destination.id === destinationId)
    : undefined;

  const defaults: TripDefaults | undefined = preset
    ? {
        city: preset.city,
        country: preset.country,
        countryCode: preset.countryCode,
        lat: preset.lat,
        lng: preset.lng,
        currency: preset.currency,
      }
    : undefined;

  const trips =
    supabase && viewer ? await getTripSummaries(supabase, viewer.id) : [];
  const openTrips = trips.filter((trip) => trip.phase === "planning" || trip.phase === "upcoming");

  return (
    <div>
      <PageHeader
        eyebrow={t.pages.planner.eyebrow}
        title={t.pages.planner.title}
        description={t.pages.planner.description}
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <GlassCard>
          <CardHeader
            eyebrow={preset ? "Preset destination" : "New trip"}
            title={preset ? `Plan ${preset.city}` : "Create a trip"}
            description={
              preset
                ? `${preset.country} · ${preset.bestMonths}. Budget guidance around $${preset.dailyBudget}/day.`
                : "You can refine every detail later — dates and budget first."
            }
          />
          <div className="mt-5">
            <TripForm configured={configured} defaults={defaults} />
          </div>
        </GlassCard>

        <div className="space-y-4">
          {preset ? (
            <GlassCard padded={false} className="overflow-hidden">
              <DestinationArtwork
                hue={preset.hue}
                countryCode={preset.countryCode}
                className="relative h-[150px]"
              >
                <div className="relative z-10 flex h-full flex-col justify-end p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">
                    {preset.region}
                  </p>
                  <h2 className="font-display text-[22px] font-semibold text-white">
                    {preset.city}
                  </h2>
                  <p className="text-[11px] text-white/65">{preset.country}</p>
                </div>
              </DestinationArtwork>
              <div className="p-4">
                <p className="text-[11.5px] leading-relaxed text-muted">{preset.summary}</p>
                <ul className="mt-3 space-y-1.5">
                  {preset.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2 text-[11px] text-muted-2">
                      <span className="size-1 rounded-full bg-accent" /> {highlight}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {preset.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard tone="accent">
              <p className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-accent-soft">
                <Sparkles className="size-3.5" /> Better trips start here
              </p>
              <ul className="mt-3 space-y-2.5 text-[11.5px] leading-relaxed text-muted">
                <li>• Set a budget and every expense tracks against it.</li>
                <li>• Add collaborators before you book, not after.</li>
                <li>• File tickets in the vault the moment they arrive.</li>
              </ul>
              <Link
                href="/discover"
                className="mt-4 inline-flex items-center gap-1 text-[11.5px] font-medium text-accent transition-colors hover:text-accent-soft"
              >
                Browse destinations <ArrowUpRight className="size-3" />
              </Link>
            </GlassCard>
          )}

          <GlassCard>
            <CardHeader
              eyebrow="In progress"
              title="Your open trips"
              action={
                <Link
                  href="/trips"
                  className="text-[11px] text-muted transition-colors hover:text-paper"
                >
                  All
                </Link>
              }
            />
            {openTrips.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarRange}
                title="No open trips"
                description="Your first plan will appear here as soon as you create it."
              />
            ) : (
              <ul className="mt-3 space-y-1">
                {openTrips.slice(0, 4).map((trip) => (
                  <li key={trip.id}>
                    <Link
                      href={`/trips/${trip.id}`}
                      className="flex items-center gap-2.5 rounded-xl px-1.5 py-2.5 transition-colors hover:bg-surface-2"
                    >
                      <span
                        className="size-8 shrink-0 rounded-[10px] border border-line"
                        style={{
                          background: `linear-gradient(150deg, hsl(${trip.cover_hue} 70% 58% / 0.65), hsl(${trip.cover_hue + 40} 60% 42% / 0.45))`,
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-medium text-paper">
                          {trip.destination_city}
                        </span>
                        <span className="block truncate text-[10px] text-muted-2">
                          {formatDateRange(trip.start_date, trip.end_date)}
                        </span>
                      </span>
                      <TripStatusBadge status={trip.phase} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
