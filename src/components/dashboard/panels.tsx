"use client";

import {
  ArrowUpRight,
  CalendarRange,
  Compass,
  FileText,
  Globe2,
  MapPin,
  Receipt,
  Route,
  Sparkles,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/primitives";
import type {
  ActivityItem,
  DashboardStats,
  ExpenseBreakdownRow,
  TripSummary,
} from "@/lib/data/trips";
import { format } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";
import { clamp, formatMoney, relativeTime } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  flights: "bg-accent",
  stay: "bg-teal",
  food: "bg-warning",
  transport: "bg-[#b8a1ff]",
  activities: "bg-positive",
  shopping: "bg-[#ffb1c9]",
  other: "bg-muted-2",
};

export function TravelStats({ stats }: { stats: DashboardStats }) {
  const { t } = useI18n();

  const items = [
    { label: t.dashboard.trips, value: stats.trips, icon: MapPin, hint: t.dashboard.acrossSpace },
    { label: t.dashboard.countries, value: stats.countries, icon: Globe2, hint: t.dashboard.visitedAbroad },
    { label: t.dashboard.daysAway, value: stats.daysTravelled, icon: Route, hint: t.dashboard.loggedJourneys },
    { label: t.dashboard.saved, value: stats.saved, icon: Compass, hint: t.dashboard.destinationsOnList },
  ];

  return (
    <GlassCard className="flex h-full flex-col">
      <CardHeader
        eyebrow={t.dashboard.travelStatistics}
        title={t.dashboard.footprint}
        action={
          <Link
            href="/trips"
            className="text-[11px] font-medium text-muted transition-colors hover:text-paper"
          >
            {t.dashboard.allTrips}
          </Link>
        }
      />
      <div className="mt-5 grid flex-1 grid-cols-2 gap-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-[16px] border border-line bg-surface-1 p-3.5 transition-colors hover:border-line"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-[0.13em] text-muted-2">
                  {item.label}
                </span>
                <Icon className="size-3.5 text-muted-2" strokeWidth={1.7} />
              </div>
              <p className="mt-2.5 font-display text-[26px] font-semibold leading-none tracking-[-0.03em]">
                {item.value}
              </p>
              <p className="mt-1 text-[10px] leading-tight text-muted-2">{item.hint}</p>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

export function BudgetOverview({
  trip,
  breakdown,
}: {
  trip: TripSummary | null;
  breakdown: ExpenseBreakdownRow[];
}) {
  const { t, locale } = useI18n();
  const budget = trip ? Number(trip.budget_amount) : 0;
  const spent = trip?.spent ?? 0;
  const used = budget > 0 ? clamp((spent / budget) * 100) : 0;
  const currency = trip?.currency ?? "USD";

  return (
    <GlassCard className="flex h-full flex-col">
      <CardHeader
        eyebrow={t.dashboard.budgetOverview}
        title={trip ? trip.destination_city : t.dashboard.noActiveBudget}
        description={
          trip
            ? format(t.dashboard.usedOf, {
                spent: formatMoney(spent, currency, {}, locale),
                budget: formatMoney(budget, currency, {}, locale),
              })
            : undefined
        }
        action={
          <Link
            href={trip ? `/trips/${trip.id}?tab=budget` : "/wallet"}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-accent transition-colors hover:text-accent-soft"
          >
            {t.dashboard.wallet} <ArrowUpRight className="size-3" />
          </Link>
        }
      />

      {!trip ? (
        <EmptyState
          compact
          icon={Wallet}
          title={t.dashboard.noBudgetTrack}
          description={t.dashboard.noBudgetDescription}
          action={
            <Link
              href="/planner"
              className="text-[11px] font-medium text-accent hover:text-accent-soft"
            >
              {t.dashboard.planTripArrow}
            </Link>
          }
        />
      ) : (
        <div className="mt-5 flex flex-1 flex-col">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-[28px] font-semibold leading-none tracking-[-0.03em]">
                {formatMoney(Math.max(budget - spent, 0), currency, {}, locale)}
              </p>
              <p className="mt-1.5 text-[11px] text-muted-2">{t.dashboard.remainingForTrip}</p>
            </div>
            <Badge tone={used >= 90 ? "danger" : used >= 70 ? "warning" : "teal"}>
              {format(t.dashboard.usedPercent, { percent: Math.round(used) })}
            </Badge>
          </div>
          <Progress
            value={used}
            tone={used >= 90 ? "danger" : used >= 70 ? "warning" : "teal"}
            className="mt-4"
            label={t.dashboard.budgetUsed}
          />

          <div className="mt-5 space-y-2.5">
            {breakdown.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-[11.5px] text-muted-2">
                {t.dashboard.noExpenses}
              </p>
            ) : (
              breakdown.slice(0, 4).map((row) => {
                const share = spent > 0 ? (row.amount / spent) * 100 : 0;
                return (
                  <div key={row.category}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <span
                          className={`size-1.5 rounded-full ${CATEGORY_COLORS[row.category] ?? "bg-muted"}`}
                        />
                        {t.categories[row.category as keyof typeof t.categories] ?? row.category}
                      </span>
                      <span className="font-medium text-paper">
                        {formatMoney(row.amount, currency, {}, locale)}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full ${CATEGORY_COLORS[row.category] ?? "bg-muted"}`}
                        style={{ width: `${clamp(share)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

const ACTIVITY_ICON = {
  trip: CalendarRange,
  itinerary: Route,
  expense: Receipt,
  document: FileText,
  saved: Compass,
} as const;

export function RecentActivity({ activity }: { activity: ActivityItem[] }) {
  const { t, locale } = useI18n();

  return (
    <GlassCard className="flex h-full flex-col">
      <CardHeader
        eyebrow={t.dashboard.recentActivity}
        title={t.dashboard.whatChanged}
        description={t.dashboard.latestEdits}
      />
      {activity.length === 0 ? (
        <EmptyState
          compact
          icon={Sparkles}
          title={t.dashboard.nothingYet}
          description={t.dashboard.nothingYetDescription}
        />
      ) : (
        <ul className="mt-4 flex-1 space-y-0.5">
          {activity.map((item) => {
            const Icon = ACTIVITY_ICON[item.kind] ?? Sparkles;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex items-start gap-2.5 rounded-xl px-1.5 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[9px] border border-line bg-surface-1 text-muted transition-colors group-hover:text-accent">
                    <Icon className="size-3.5" strokeWidth={1.7} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-paper">
                      {item.title}
                    </span>
                    <span className="block truncate text-[10.5px] text-muted-2">
                      {item.detail}
                    </span>
                  </span>
                  <span className="shrink-0 pt-0.5 text-[10px] text-muted-2">
                    {relativeTime(item.at, locale)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
