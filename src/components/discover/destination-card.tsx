"use client";

import { ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";

import { DestinationArtwork } from "@/components/dashboard/destination-artwork";
import { SaveDestinationButton } from "@/components/discover/save-button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import type { Destination } from "@/lib/destinations";
import { format } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";
import { formatMoney } from "@/lib/utils";

export function DestinationCard({
  destination,
  saved = false,
  canSave = false,
  compact = false,
}: {
  destination: Destination;
  saved?: boolean;
  canSave?: boolean;
  compact?: boolean;
}) {
  const { t, locale } = useI18n();

  return (
    <GlassCard
      padded={false}
      className="group flex h-full flex-col overflow-hidden transition-colors duration-300 hover:border-line-strong"
    >
      <DestinationArtwork
        hue={destination.hue}
        countryCode={destination.countryCode}
        className={compact ? "relative h-[112px]" : "relative h-[138px]"}
      >
        <div className="relative z-10 flex h-full flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-2">
            <Badge tone="neutral" className="border-line-strong bg-ink/40 text-white/75 backdrop-blur-md">
              {destination.region}
            </Badge>
            {canSave ? (
              <SaveDestinationButton
                city={destination.city}
                country={destination.country}
                countryCode={destination.countryCode}
                lat={destination.lat}
                lng={destination.lng}
                initialSaved={saved}
                canSave={canSave}
              />
            ) : null}
          </div>
          <div>
            <h3 className="font-display text-[21px] font-semibold leading-tight tracking-[-0.02em] text-white">
              {destination.city}
            </h3>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-white/65">
              <MapPin className="size-3" /> {destination.country}
            </p>
          </div>
        </div>
      </DestinationArtwork>

      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-[11.5px] leading-relaxed text-muted">
          {destination.summary}
        </p>

        <div className="mt-3 flex flex-wrap gap-1">
          {destination.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line bg-surface-1 px-2 py-0.5 text-[9.5px] text-muted-2"
            >
              {tag}
            </span>
          ))}
          <span className="rounded-full border border-line bg-surface-1 px-2 py-0.5 text-[9.5px] text-muted-2">
            {format(t.dashboard.perDay, {
              amount: formatMoney(
                destination.dailyBudget,
                "USD",
                { maximumFractionDigits: 0 },
                locale,
              ),
            })}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="inline-flex items-center gap-1 text-[9.5px] text-muted-2">
            <Sparkles className="size-2.5" /> {destination.bestMonths}
          </span>
          <Link
            href={`/planner?destination=${destination.id}`}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-1.5 text-[10.5px] font-medium text-paper transition-colors hover:border-accent/30 hover:bg-accent/10"
          >
            {t.dashboard.planTripShort} <ArrowUpRight className="size-2.5" />
          </Link>
        </div>
      </div>
    </GlassCard>
  );
}
