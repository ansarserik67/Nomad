import { CalendarDays, FileText, Route, Users } from "lucide-react";
import Link from "next/link";

import { DestinationArtwork } from "@/components/dashboard/destination-artwork";
import { TripStatusBadge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/primitives";
import type { TripSummary } from "@/lib/data/trips";
import { clamp, formatDateRange, formatMoney } from "@/lib/utils";

export function TripCard({ trip }: { trip: TripSummary }) {
  const budget = Number(trip.budget_amount);
  const used = budget > 0 ? clamp((trip.spent / budget) * 100) : 0;

  return (
    <GlassCard padded={false} className="group overflow-hidden">
      <Link href={`/trips/${trip.id}`} className="block">
        <DestinationArtwork
          hue={trip.cover_hue}
          countryCode={trip.destination_country_code}
          watermark={false}
          className="relative h-[104px]"
        >
          <div className="relative z-10 flex h-full flex-col justify-between p-4">
            <div className="flex items-start justify-between">
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-white/60">
                {trip.destination_country}
              </span>
              <TripStatusBadge status={trip.phase} />
            </div>
            <h3 className="font-display text-[20px] font-semibold leading-tight text-white">
              {trip.destination_city}
            </h3>
          </div>
        </DestinationArtwork>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-paper">{trip.title}</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[10.5px] text-muted-2">
                <CalendarDays className="size-3" />
                {formatDateRange(trip.start_date, trip.end_date)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-medium text-paper">
                {formatMoney(trip.spent, trip.currency, { compact: true })}
              </p>
              <p className="text-[9.5px] text-muted-2">
                of {formatMoney(budget, trip.currency, { compact: true })}
              </p>
            </div>
          </div>

          <Progress
            value={used}
            tone={used >= 90 ? "danger" : used >= 70 ? "warning" : "teal"}
            className="mt-3"
            label={`${trip.destination_city} budget used`}
          />

          <div className="mt-3 flex items-center gap-3.5 text-[10px] text-muted-2">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" /> {trip.travelers}
            </span>
            <span className="inline-flex items-center gap-1">
              <Route className="size-3" /> {trip.itineraryCount} plans
            </span>
            <span className="inline-flex items-center gap-1">
              <FileText className="size-3" /> {trip.documentCount} docs
            </span>
            {trip.memberCount > 0 ? (
              <span className="ml-auto inline-flex items-center gap-1">
                {trip.memberCount} member{trip.memberCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </GlassCard>
  );
}
