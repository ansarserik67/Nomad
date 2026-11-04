import type { Metadata } from "next";
import { ArrowUpRight, Compass, Map as MapIcon, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AssistantWidget } from "@/components/dashboard/assistant-widget";
import { BudgetOverview, RecentActivity, TravelStats } from "@/components/dashboard/panels";
import { UpcomingTripCard } from "@/components/dashboard/upcoming-trip";
import { WorldMap } from "@/components/dashboard/world-map";
import { DestinationCard } from "@/components/discover/destination-card";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/primitives";
import { getAiQuota } from "@/lib/ai/quota";
import { getAuthContext } from "@/lib/auth";
import { getDashboardSnapshot, type DashboardSnapshot } from "@/lib/data/trips";
import { recommendedDestinations } from "@/lib/destinations";
import { isAiConfigured } from "@/lib/env.server";
import { format as formatTemplate } from "@/lib/i18n/dictionaries";
import { getServerDictionary } from "@/lib/i18n/server";
import { mapboxToken } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ t, locale }, { supabase, viewer, configured }] = await Promise.all([
    getServerDictionary(),
    getAuthContext(),
  ]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t.pages.dashboard.goodMorning
      : hour < 18
        ? t.pages.dashboard.goodAfternoon
        : t.pages.dashboard.goodEvening;
  if (configured && !viewer) redirect("/login");

  const emptySnapshot: DashboardSnapshot = {
    trips: [],
    focusTrip: null,
    breakdown: [],
    activity: [],
    stats: { trips: 0, countries: 0, daysTravelled: 0, saved: 0, upcoming: 0 },
  };

  const snapshot =
    supabase && viewer
      ? await getDashboardSnapshot(supabase, viewer.id)
      : emptySnapshot;

  const quota = supabase && viewer ? await getAiQuota(supabase).catch(() => null) : null;

  const focus = snapshot.focusTrip;
  const markers = snapshot.trips
    .filter(
      (trip) =>
        typeof trip.destination_lat === "number" && typeof trip.destination_lng === "number",
    )
    .slice(0, 6)
    .map((trip) => ({
      id: trip.id,
      city: trip.destination_city,
      country: trip.destination_country,
      lat: trip.destination_lat as number,
      lng: trip.destination_lng as number,
      label: trip.start_date ? formatDate(trip.start_date, { month: "short", year: "numeric" }) : undefined,
    }));

  const firstName = viewer?.firstName ?? "traveller";
  const recommendations = recommendedDestinations(4, snapshot.stats.saved + snapshot.stats.trips);

  const description = !configured
    ? t.pages.dashboard.noBackend
    : focus
      ? focus.phase === "active"
        ? formatTemplate(t.pages.dashboard.travellingNow, {
            city: focus.destination_city,
            plans: focus.itineraryCount,
            documents: focus.documentCount,
          })
        : focus.phase === "upcoming" && focus.daysUntilStart !== null
          ? formatTemplate(t.pages.dashboard.upcoming, {
              city: focus.destination_city,
              days: `${focus.daysUntilStart} ${focus.daysUntilStart === 1 ? t.common.day : t.common.days}`,
              plans: focus.itineraryCount,
              documents: focus.documentCount,
            })
          : formatTemplate(t.pages.dashboard.shaping, { city: focus.destination_city })
      : t.pages.dashboard.empty;

  const assistantUnavailableReason = !configured
    ? "Connect Supabase so the assistant can read your trips and budgets."
    : !viewer
      ? "Sign in to use your five daily AI operations."
      : !isAiConfigured
        ? "GEMINI_API_KEY is not configured on the server yet."
        : undefined;

  return (
    <div>
      <PageHeader
        eyebrow={formatDate(
          new Date(),
          {
            weekday: "long",
            day: "numeric",
            month: "long",
          },
          locale,
        )}
        title={formatTemplate(t.pages.dashboard.greeting, {
          greeting,
          name: firstName,
        })}
        description={description}
        actions={
          <>
            <Link
              href="/assistant"
              className="hidden h-10 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-4 text-[12.5px] font-medium text-paper transition-colors hover:bg-surface-3 sm:inline-flex"
            >
              <Compass className="size-3.5" /> {t.pages.dashboard.askNomad}
            </Link>
            <Link
              href="/planner"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-[12.5px] font-medium text-on-accent transition-colors hover:bg-accent-soft"
            >
              <Plus className="size-4" /> {t.pages.dashboard.newTrip}
            </Link>
          </>
        }
      />

      <div className="mt-6 space-y-4">
        <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
          <Reveal className="min-w-0">
            <UpcomingTripCard trip={focus} />
          </Reveal>
          <Reveal delay={0.06} className="min-w-0">
            <AssistantWidget
              available={Boolean(configured && viewer && isAiConfigured)}
              unavailableReason={assistantUnavailableReason}
              initialQuota={quota}
            />
          </Reveal>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
          <Reveal delay={0.08} className="min-w-0">
            <GlassCard className="flex h-full flex-col">
              <CardHeader
                eyebrow={t.dashboard.worldView}
                title={t.dashboard.whereJourneys}
                action={
                  <Link
                    href="/trips"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-paper"
                  >
                    <MapIcon className="size-3" /> {t.dashboard.myTrips}
                  </Link>
                }
              />
              <div className="mt-4 flex-1">
                <WorldMap token={mapboxToken} markers={markers} height={286} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone="accent">
                  {snapshot.stats.countries} {t.dashboard.countries.toLowerCase()}
                </Badge>
                <Badge tone="teal">
                  {snapshot.stats.upcoming} {t.dashboard.upcomingLabel}
                </Badge>
                {!mapboxToken ? (
                  <Link
                    href="/setup"
                    className="ml-auto inline-flex items-center gap-1 text-[10.5px] text-muted-2 transition-colors hover:text-muted"
                  >
                    {t.settings.setup} <ArrowUpRight className="size-2.5" />
                  </Link>
                ) : null}
              </div>
            </GlassCard>
          </Reveal>
          <Reveal delay={0.12} className="min-w-0">
            <TravelStats stats={snapshot.stats} />
          </Reveal>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Reveal delay={0.14} className="min-w-0">
            <BudgetOverview trip={focus} breakdown={snapshot.breakdown} />
          </Reveal>
          <Reveal delay={0.18} className="min-w-0">
            <RecentActivity activity={snapshot.activity} />
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <section aria-labelledby="recommended-heading">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="label-eyebrow mb-1.5">{t.dashboard.recommended}</p>
                <h2
                  id="recommended-heading"
                  className="font-display text-lg font-semibold tracking-[-0.02em]"
                >
                  {t.dashboard.placesWorthFlight}
                </h2>
              </div>
              <Link
                href="/discover"
                className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-medium text-muted transition-colors hover:text-paper"
              >
                Explore all <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {recommendations.map((destination) => (
                <DestinationCard key={destination.id} destination={destination} compact />
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
