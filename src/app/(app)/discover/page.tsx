import type { Metadata } from "next";
import { Bookmark, Compass, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { DestinationCard } from "@/components/discover/destination-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/primitives";
import { getServerDictionary } from "@/lib/i18n/server";
import { getAuthContext } from "@/lib/auth";
import { DESTINATIONS, REGIONS, type Region } from "@/lib/destinations";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Discover" };
export const dynamic = "force-dynamic";

type Search = { q?: string; region?: string; view?: string };

function buildHref(base: Search, overrides: Partial<Search>) {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  if (merged.q) params.set("q", merged.q);
  if (merged.region && merged.region !== "All") params.set("region", merged.region);
  if (merged.view === "saved") params.set("view", "saved");
  const query = params.toString();
  return query ? `/discover?${query}` : "/discover";
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const [{ t }, { supabase, viewer, configured }] = await Promise.all([
    getServerDictionary(),
    getAuthContext(),
  ]);
  const { q = "", region = "All", view = "all" } = await searchParams;

  const savedRows =
    supabase && viewer
      ? (
          await supabase
            .from("saved_destinations")
            .select("id, city, country_code")
            .order("created_at", { ascending: false })
        ).data ?? []
      : [];

  const savedKeys = new Set(savedRows.map((row) => `${row.city}|${row.country_code}`));
  const query = q.trim().toLowerCase();

  const filtered = DESTINATIONS.filter((destination) => {
    const matchesRegion = region === "All" || destination.region === (region as Region);
    const matchesQuery =
      !query ||
      destination.city.toLowerCase().includes(query) ||
      destination.country.toLowerCase().includes(query) ||
      destination.region.toLowerCase().includes(query) ||
      destination.tags.some((tag) => tag.toLowerCase().includes(query));
    const matchesSaved =
      view !== "saved" || savedKeys.has(`${destination.city}|${destination.countryCode}`);
    return matchesRegion && matchesQuery && matchesSaved;
  });

  const canSave = Boolean(configured && viewer);
  const showingSaved = view === "saved";

  return (
    <div>
      <PageHeader
        eyebrow={t.pages.discover.eyebrow}
        title={t.pages.discover.title}
        description={t.pages.discover.description}
        actions={
          canSave ? (
            <Link
              href={buildHref({ q, region }, { view: showingSaved ? "all" : "saved" })}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[12.5px] font-medium transition-colors",
                showingSaved
                  ? "border-accent/35 bg-accent/12 text-accent-soft"
                  : "border-line bg-surface-2 text-paper hover:bg-surface-3",
              )}
            >
              <Bookmark className={cn("size-3.5", showingSaved && "fill-current")} />
              Saved {savedRows.length > 0 ? `(${savedRows.length})` : ""}
            </Link>
          ) : null
        }
      />

      <GlassCard className="mt-6" tone="subtle">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <form action="/discover" method="get" className="min-w-0 flex-1">
            <input type="hidden" name="region" value={region} />
            {showingSaved ? <input type="hidden" name="view" value="saved" /> : null}
            <label htmlFor="discover-search" className="sr-only">
              Search destinations
            </label>
            <Input
              id="discover-search"
              name="q"
              defaultValue={q}
              placeholder="Search a city, country or travel style…"
              leadingIcon={<Search className="size-4" />}
            />
          </form>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 hidden items-center gap-1 text-[10.5px] text-muted-2 sm:inline-flex">
              <SlidersHorizontal className="size-3" /> Region
            </span>
            {(["All", ...REGIONS] as const).map((item) => {
              const active = region === item;
              return (
                <Link
                  key={item}
                  href={buildHref({ q, region: item, view }, {})}
                  className={cn(
                    "rounded-full border px-2.5 py-1.5 text-[10.5px] font-medium transition-colors",
                    active
                      ? "border-accent/30 bg-accent/10 text-accent-soft"
                      : "border-line bg-surface-1 text-muted hover:border-line-strong hover:text-paper",
                  )}
                >
                  {item}
                </Link>
              );
            })}
          </div>
        </div>
      </GlassCard>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-[11.5px] text-muted-2">
          {filtered.length} {filtered.length === 1 ? "destination" : "destinations"}
          {query ? ` for “${q}”` : ""}
          {showingSaved ? " in your saved list" : ""}
        </p>
        {!configured ? (
          <p className="text-[10.5px] text-warning">Connect Supabase to save destinations</p>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="mt-4">
          <EmptyState
            icon={showingSaved ? Bookmark : Compass}
            title={showingSaved ? "Nothing saved yet" : "No destinations match that search"}
            description={
              showingSaved
                ? "Tap the bookmark on any destination to keep it here for later."
                : "Try a different city, country or travel style — or clear the filters to see the full catalog."
            }
            action={
              <Link href={buildHref({}, { view: "all" })} className="inline-flex">
                <Button variant="secondary" size="sm">
                  Browse everything
                </Button>
              </Link>
            }
          />
        </GlassCard>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              saved={savedKeys.has(`${destination.city}|${destination.countryCode}`)}
              canSave={canSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
