import type { Metadata } from "next";
import { Map, Plus, Search } from "lucide-react";
import Link from "next/link";

import { TripCard } from "@/components/trips/trip-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/primitives";
import { getServerDictionary } from "@/lib/i18n/server";
import { getAuthContext } from "@/lib/auth";
import { getTripSummaries } from "@/lib/data/trips";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My Trips" };
export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "planning", label: "Planning" },
  { key: "upcoming", label: "Upcoming" },
  { key: "active", label: "Travelling" },
  { key: "completed", label: "Completed" },
] as const;

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const [{ t }, { supabase, viewer, configured }] = await Promise.all([
    getServerDictionary(),
    getAuthContext(),
  ]);
  const { status = "all", q = "" } = await searchParams;
  const trips = supabase && viewer ? await getTripSummaries(supabase, viewer.id) : [];

  const query = q.trim().toLowerCase();
  const filtered = trips.filter((trip) => {
    const matchesStatus =
      status === "all" ||
      (status === "active" ? trip.phase === "active" : trip.phase === status);
    const matchesQuery =
      !query ||
      trip.title.toLowerCase().includes(query) ||
      trip.destination_city.toLowerCase().includes(query) ||
      trip.destination_country.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  function href(nextStatus: string) {
    const params = new URLSearchParams();
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/trips?${qs}` : "/trips";
  }

  return (
    <div>
      <PageHeader
        eyebrow={t.pages.trips.eyebrow}
        title={t.pages.trips.title}
        description={t.pages.trips.description}
        actions={
          <Link href="/planner" className="inline-flex">
            <Button size="md">
              <Plus className="size-4" /> New trip
            </Button>
          </Link>
        }
      />

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((filter) => (
            <Link
              key={filter.key}
              href={href(filter.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                status === filter.key
                  ? "border-accent/30 bg-accent/10 text-accent-soft"
                  : "border-line bg-surface-1 text-muted hover:border-line-strong hover:text-paper",
              )}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        <form action="/trips" method="get" className="w-full lg:w-[280px]">
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
          <label htmlFor="trip-search" className="sr-only">
            Search trips
          </label>
          <Input
            id="trip-search"
            name="q"
            defaultValue={q}
            placeholder="Search your trips…"
            leadingIcon={<Search className="size-4" />}
          />
        </form>
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="mt-4">
          <EmptyState
            icon={Map}
            title={
              trips.length === 0
                ? "Your first journey goes here"
                : "No trips match these filters"
            }
            description={
              trips.length === 0
                ? configured
                  ? "Create a trip and NOMAD connects the itinerary, wallet, group and vault to it."
                  : "Connect Supabase to save trips, then create your first one."
                : "Try another status or clear the search to see all trips."
            }
            action={
              trips.length === 0 ? (
                <Link href="/planner" className="inline-flex">
                  <Button size="sm">
                    <Plus className="size-3.5" /> Plan a trip
                  </Button>
                </Link>
              ) : (
                <Link href="/trips" className="inline-flex">
                  <Button size="sm" variant="secondary">
                    Clear filters
                  </Button>
                </Link>
              )
            }
          />
        </GlassCard>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
