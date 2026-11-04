import type { Metadata } from "next";
import { ArrowUpRight, PieChart, Receipt, Wallet } from "lucide-react";
import Link from "next/link";

import { CurrencyConverter } from "@/components/wallet/currency-converter";
import { Badge, TripStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { PageHeader, Progress } from "@/components/ui/primitives";
import { getAuthContext } from "@/lib/auth";
import { getServerDictionary } from "@/lib/i18n/server";
import {
  getExpenseBreakdown,
  getTripSummaries,
  pickFocusTrip,
} from "@/lib/data/trips";
import {
  clamp,
  EXPENSE_CATEGORY_LABEL,
  formatDate,
  formatDateRange,
  formatMoney,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Travel Wallet" };
export const dynamic = "force-dynamic";

const CATEGORY_COLORS: Record<string, string> = {
  flights: "bg-accent",
  stay: "bg-teal",
  food: "bg-warning",
  transport: "bg-[#b8a1ff]",
  activities: "bg-positive",
  shopping: "bg-[#ffb1c9]",
  other: "bg-muted-2",
};

export default async function WalletPage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string }>;
}) {
  const [{ t }, { supabase, viewer }] = await Promise.all([
    getServerDictionary(),
    getAuthContext(),
  ]);
  const { trip: selectedTripId } = await searchParams;

  const trips = supabase && viewer ? await getTripSummaries(supabase, viewer.id) : [];
  const focus =
    trips.find((trip) => trip.id === selectedTripId) ??
    pickFocusTrip(trips) ??
    trips[0] ??
    null;

  const breakdown = supabase && focus ? await getExpenseBreakdown(supabase, focus.id) : [];

  const recentResult =
    supabase && viewer
      ? await supabase
          .from("expenses")
          .select("id, title, amount, currency, spent_on, category, trip_id")
          .order("spent_on", { ascending: false })
          .limit(6)
      : { data: [] };

  const recent = recentResult.data ?? [];
  const tripById = new Map(trips.map((item) => [item.id, item]));
  const homeCurrency = viewer?.profile?.home_currency ?? "USD";

  const focusSpent = breakdown.reduce((sum, row) => sum + row.amount, 0);
  const focusDays = focus?.nights && focus.nights > 0 ? focus.nights : null;
  const dailyAverage = focusDays ? focusSpent / focusDays : null;

  return (
    <div>
      <PageHeader
        eyebrow={t.pages.wallet.eyebrow}
        title={t.pages.wallet.title}
        description={t.pages.wallet.description}
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <GlassCard className="flex h-full flex-col">
          <CardHeader
            eyebrow="Trip wallets"
            title={trips.length > 0 ? `${trips.length} trip${trips.length === 1 ? "" : "s"} tracked` : "No budgets yet"}
            description="Each balance is shown in its own trip currency."
            action={
              <Link
                href="/planner"
                className="text-[11px] font-medium text-accent transition-colors hover:text-accent-soft"
              >
                New trip
              </Link>
            }
          />
          {trips.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="The wallet starts with a trip"
              description="Create a trip with a budget, then record expenses against it here."
            />
          ) : (
            <ul className="mt-4 space-y-1.5">
              {trips.slice(0, 5).map((trip) => {
                const budget = Number(trip.budget_amount);
                const used = budget > 0 ? clamp((trip.spent / budget) * 100) : 0;
                return (
                  <li key={trip.id}>
                    <Link
                      href={`/wallet?trip=${trip.id}`}
                      className={`block rounded-[14px] border px-3.5 py-3 transition-colors ${
                        focus?.id === trip.id
                          ? "border-accent/25 bg-accent/[0.05]"
                          : "border-line bg-surface-1 hover:border-line"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="size-9 shrink-0 rounded-[11px] border border-line"
                          style={{
                            background: `linear-gradient(150deg, hsl(${trip.cover_hue} 70% 58% / 0.65), hsl(${trip.cover_hue + 40} 60% 42% / 0.4))`,
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[12.5px] font-medium text-paper">
                              {trip.destination_city}
                            </p>
                            <TripStatusBadge status={trip.phase} />
                          </div>
                          <p className="mt-0.5 text-[10px] text-muted-2">
                            {formatDateRange(trip.start_date, trip.end_date)} ·{" "}
                            {trip.currency}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[12px] font-medium text-paper">
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
                        className="mt-2.5"
                        label={`${trip.destination_city} budget used`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        <CurrencyConverter
          homeCurrency={homeCurrency}
          currencies={[
            "USD",
            "EUR",
            "GBP",
            "JPY",
            "AUD",
            "CAD",
            "CHF",
            "CNY",
            "INR",
            "KRW",
            "MXN",
            "NZD",
            "SGD",
            "ZAR",
            "AED",
            "THB",
            "TRY",
            "BRL",
          ]}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <GlassCard className="flex h-full flex-col">
          <CardHeader
            eyebrow="Analytics"
            title={focus ? `${focus.destination_city} breakdown` : "Category breakdown"}
            description={
              focus && focusSpent > 0
                ? `${formatMoney(focusSpent, focus.currency)} recorded${
                    dailyAverage !== null
                      ? ` · ${formatMoney(dailyAverage, focus.currency)} per night`
                      : ""
                  }`
                : "Add expenses to see where the money goes."
            }
            action={
              focus ? (
                <Link
                  href={`/trips/${focus.id}?tab=budget`}
                  className="inline-flex items-center gap-1 text-[11px] text-accent transition-colors hover:text-accent-soft"
                >
                  Add expense <ArrowUpRight className="size-3" />
                </Link>
              ) : null
            }
          />
          {!focus || breakdown.length === 0 ? (
            <EmptyState
              icon={PieChart}
              title="No spending to analyse"
              description="Record your first expense on a trip and the categories fill in automatically."
            />
          ) : (
            <div className="mt-5 space-y-3">
              {breakdown.map((row) => {
                const share = focusSpent > 0 ? (row.amount / focusSpent) * 100 : 0;
                return (
                  <div key={row.category}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[11.5px]">
                      <span className="inline-flex items-center gap-2 text-muted">
                        <span
                          className={`size-1.5 rounded-full ${CATEGORY_COLORS[row.category] ?? "bg-muted"}`}
                        />
                        {EXPENSE_CATEGORY_LABEL[row.category] ?? row.category}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-2">{Math.round(share)}%</span>
                        <span className="font-medium text-paper">
                          {formatMoney(row.amount, focus.currency)}
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full ${CATEGORY_COLORS[row.category] ?? "bg-muted"}`}
                        style={{ width: `${clamp(share)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t border-line pt-3 text-[11px]">
                <span className="text-muted-2">Remaining budget</span>
                <span
                  className={
                    Number(focus.budget_amount) - focusSpent < 0
                      ? "font-medium text-danger"
                      : "font-medium text-teal"
                  }
                >
                  {formatMoney(
                    Number(focus.budget_amount) - focusSpent,
                    focus.currency,
                  )}
                </span>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="flex h-full flex-col">
          <CardHeader
            eyebrow="Recent expenses"
            title="Across all trips"
            description="Newest payments recorded in your wallet."
          />
          {recent.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses recorded"
              description="Open a trip's budget tab to record the first payment."
            />
          ) : (
            <ul className="mt-4 divide-y divide-white/[0.05]">
              {recent.map((expense) => {
                const trip = tripById.get(expense.trip_id);
                return (
                  <li key={expense.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-paper">
                        {expense.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-2">
                        {trip?.destination_city ?? "Trip"} ·{" "}
                        {EXPENSE_CATEGORY_LABEL[expense.category] ?? expense.category} ·{" "}
                        {formatDate(expense.spent_on)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[12px] font-medium text-paper">
                      {formatMoney(Number(expense.amount), expense.currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-auto pt-4">
            <Badge tone="neutral">
              Trips in {new Set(trips.map((trip) => trip.currency)).size || 1} currenc
              {new Set(trips.map((trip) => trip.currency)).size === 1 ? "y" : "ies"}
            </Badge>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
