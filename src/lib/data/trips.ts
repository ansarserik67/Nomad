import "server-only";

import type {
  DocumentRecord,
  Expense,
  ItineraryItem,
  Trip,
  TripMember,
  TripMemberRole,
} from "@/lib/database.types";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import { daysUntil, nightsBetween, todayIso } from "@/lib/utils";

export class DataError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "DataError";
  }
}

export type TripPhase = "planning" | "upcoming" | "active" | "completed" | "archived";

export type TripSummary = Trip & {
  spent: number;
  memberCount: number;
  itineraryCount: number;
  documentCount: number;
  role: TripMemberRole;
  phase: TripPhase;
  nights: number;
  daysUntilStart: number | null;
};

export function derivePhase(trip: Pick<Trip, "status" | "start_date" | "end_date">): TripPhase {
  if (trip.status === "archived") return "archived";
  if (trip.status === "completed") return "completed";
  const today = todayIso();
  if (trip.start_date && trip.end_date) {
    if (trip.end_date < today) return "completed";
    if (trip.start_date <= today && trip.end_date >= today) return "active";
    if (trip.start_date > today) return "upcoming";
  }
  if (trip.start_date && trip.start_date > today) return "upcoming";
  if (trip.start_date && trip.start_date <= today && !trip.end_date) return "active";
  return "planning";
}

function roleFor(
  trip: Trip,
  members: Array<{ user_id: string | null; role: TripMemberRole }>,
  userId: string,
): TripMemberRole {
  if (trip.owner_id === userId) return "owner";
  const membership = members.find((member) => member.user_id === userId);
  return membership?.role ?? "viewer";
}

export async function getTripSummaries(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<TripSummary[]> {
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new DataError("Could not load your trips.", error);
  if (!trips || trips.length === 0) return [];

  const tripIds = trips.map((trip) => trip.id);

  const [expensesResult, membersResult, itineraryResult, documentsResult] = await Promise.all([
    supabase
      .from("expenses")
      .select("trip_id, amount, exchange_rate")
      .in("trip_id", tripIds),
    supabase
      .from("trip_members")
      .select("trip_id, user_id, role, status")
      .in("trip_id", tripIds),
    supabase.from("itinerary_items").select("trip_id").in("trip_id", tripIds),
    supabase.from("documents").select("trip_id").in("trip_id", tripIds),
  ]);

  const failed = [expensesResult, membersResult, itineraryResult, documentsResult].find(
    (result) => result.error,
  );
  if (failed?.error) throw new DataError("Could not load trip totals.", failed.error);

  const expenses = expensesResult.data ?? [];
  const members = membersResult.data ?? [];
  const itinerary = itineraryResult.data ?? [];
  const documents = documentsResult.data ?? [];

  return trips.map((trip) => {
    const spent = expenses
      .filter((expense) => expense.trip_id === trip.id)
      .reduce((sum, expense) => sum + Number(expense.amount) * Number(expense.exchange_rate), 0);

    const tripMembers = members.filter((member) => member.trip_id === trip.id);

    return {
      ...trip,
      spent,
      memberCount: tripMembers.length,
      itineraryCount: itinerary.filter((item) => item.trip_id === trip.id).length,
      documentCount: documents.filter((document) => document.trip_id === trip.id).length,
      role: roleFor(trip, tripMembers, userId),
      phase: derivePhase(trip),
      nights: nightsBetween(trip.start_date, trip.end_date),
      daysUntilStart: daysUntil(trip.start_date),
    };
  });
}

export function pickFocusTrip(trips: TripSummary[]): TripSummary | null {
  const live = trips.filter((trip) => trip.phase !== "archived" && trip.phase !== "completed");
  const active = live.find((trip) => trip.phase === "active");
  if (active) return active;
  const upcoming = live
    .filter((trip) => trip.phase === "upcoming")
    .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""));
  if (upcoming.length > 0) return upcoming[0] as TripSummary;
  const planning = live.find((trip) => trip.phase === "planning");
  if (planning) return planning;
  return (
    [...trips]
      .filter((trip) => trip.phase !== "archived")
      .sort((a, b) => (b.end_date ?? b.updated_at).localeCompare(a.end_date ?? a.updated_at))[0] ??
    null
  );
}

export type ActivityItem = {
  id: string;
  kind: "trip" | "itinerary" | "expense" | "document" | "saved";
  title: string;
  detail: string;
  at: string;
  href: string;
};

export async function getRecentActivity(
  supabase: ServerSupabaseClient,
  trips: TripSummary[],
): Promise<ActivityItem[]> {
  const tripIds = trips.map((trip) => trip.id);
  if (tripIds.length === 0) return [];

  const [itineraryResult, expensesResult, documentsResult] = await Promise.all([
    supabase
      .from("itinerary_items")
      .select("id, trip_id, title, created_at")
      .in("trip_id", tripIds)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("expenses")
      .select("id, trip_id, title, amount, currency, created_at")
      .in("trip_id", tripIds)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("documents")
      .select("id, title, created_at, trip_id")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const failed = [itineraryResult, expensesResult, documentsResult].find(
    (result) => result.error,
  );
  if (failed?.error) throw new DataError("Could not load recent activity.", failed.error);

  const tripById = new Map(trips.map((trip) => [trip.id, trip]));
  const items: ActivityItem[] = [];

  for (const item of itineraryResult.data ?? []) {
    const trip = tripById.get(item.trip_id);
    items.push({
      id: `itinerary-${item.id}`,
      kind: "itinerary",
      title: item.title,
      detail: trip ? `Added to ${trip.destination_city}` : "Added to itinerary",
      at: item.created_at,
      href: trip ? `/trips/${trip.id}` : "/trips",
    });
  }

  for (const expense of expensesResult.data ?? []) {
    const trip = tripById.get(expense.trip_id);
    items.push({
      id: `expense-${expense.id}`,
      kind: "expense",
      title: expense.title,
      detail: `${expense.currency} ${Number(expense.amount).toFixed(2)} · ${
        trip?.destination_city ?? "Trip"
      }`,
      at: expense.created_at,
      href: trip ? `/trips/${trip.id}?tab=budget` : "/wallet",
    });
  }

  for (const document of documentsResult.data ?? []) {
    items.push({
      id: `document-${document.id}`,
      kind: "document",
      title: document.title,
      detail: document.trip_id ? "Filed in Travel Vault" : "Added to Travel Vault",
      at: document.created_at,
      href: "/vault",
    });
  }

  for (const trip of [...trips]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 2)) {
    items.push({
      id: `trip-${trip.id}`,
      kind: "trip",
      title: trip.title,
      detail: `Trip updated · ${trip.destination_city}`,
      at: trip.updated_at,
      href: `/trips/${trip.id}`,
    });
  }

  return items
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);
}

export type ExpenseBreakdownRow = {
  category: Expense["category"];
  amount: number;
};

export async function getExpenseBreakdown(
  supabase: ServerSupabaseClient,
  tripId: string,
): Promise<ExpenseBreakdownRow[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("category, amount, exchange_rate")
    .eq("trip_id", tripId);

  if (error) throw new DataError("Could not load the trip budget.", error);

  const totals = new Map<string, number>();
  for (const expense of data ?? []) {
    const value = Number(expense.amount) * Number(expense.exchange_rate);
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + value);
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category: category as Expense["category"], amount }))
    .sort((a, b) => b.amount - a.amount);
}

export type DashboardStats = {
  trips: number;
  countries: number;
  daysTravelled: number;
  saved: number;
  upcoming: number;
};

export type DashboardSnapshot = {
  trips: TripSummary[];
  focusTrip: TripSummary | null;
  breakdown: ExpenseBreakdownRow[];
  activity: ActivityItem[];
  stats: DashboardStats;
};

export async function getDashboardSnapshot(
  supabase: ServerSupabaseClient,
  userId: string,
): Promise<DashboardSnapshot> {
  const [trips, savedResult] = await Promise.all([
    getTripSummaries(supabase, userId),
    supabase.from("saved_destinations").select("id, country_code"),
  ]);

  if (savedResult.error) {
    throw new DataError("Could not load your saved destinations.", savedResult.error);
  }

  const focusTrip = pickFocusTrip(trips);
  const [breakdown, activity] = await Promise.all([
    focusTrip ? getExpenseBreakdown(supabase, focusTrip.id) : Promise.resolve([]),
    getRecentActivity(supabase, trips),
  ]);

  const visited = trips.filter(
    (trip) => trip.phase === "completed" || trip.phase === "active",
  );
  const countries = new Set(
    visited.map((trip) => trip.destination_country_code ?? trip.destination_country),
  ).size;
  const daysTravelled = visited.reduce(
    (sum, trip) => sum + (trip.nights || 1),
    0,
  );

  return {
    trips,
    focusTrip,
    breakdown,
    activity,
    stats: {
      trips: trips.filter((trip) => trip.phase !== "archived").length,
      countries,
      daysTravelled,
      saved: savedResult.data?.length ?? 0,
      upcoming: trips.filter((trip) => trip.phase === "upcoming" || trip.phase === "active")
        .length,
    },
  };
}

export type TripDetail = {
  trip: Trip;
  members: TripMember[];
  itinerary: ItineraryItem[];
  expenses: Expense[];
  documents: DocumentRecord[];
  role: TripMemberRole;
  canEdit: boolean;
};

export async function getTripDetail(
  supabase: ServerSupabaseClient,
  tripId: string,
  userId: string,
): Promise<TripDetail | null> {
  const { data: trip, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .maybeSingle();

  if (error) throw new DataError("Could not load this trip.", error);
  if (!trip) return null;

  const [membersResult, itineraryResult, expensesResult, documentsResult] = await Promise.all([
    supabase
      .from("trip_members")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true }),
    supabase
      .from("itinerary_items")
      .select("*")
      .eq("trip_id", tripId)
      .order("day_date", { ascending: true, nullsFirst: false })
      .order("start_time", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true }),
    supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId)
      .order("spent_on", { ascending: false }),
    supabase
      .from("documents")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false }),
  ]);

  const failed = [membersResult, itineraryResult, expensesResult, documentsResult].find(
    (result) => result.error,
  );
  if (failed?.error) throw new DataError("Could not load this trip's details.", failed.error);

  const members = membersResult.data ?? [];
  const role = roleFor(trip, members, userId);

  return {
    trip,
    members,
    itinerary: itineraryResult.data ?? [],
    expenses: expensesResult.data ?? [],
    documents: documentsResult.data ?? [],
    role,
    canEdit: role === "owner" || role === "editor",
  };
}

export type TravelStatus = {
  state: "home" | "upcoming" | "travelling";
  label: string;
  city: string;
  country: string;
  date: string | null;
  days: number | null;
};

export async function getTravelStatus(supabase: ServerSupabaseClient): Promise<TravelStatus> {
  try {
    const { data } = await supabase
      .from("trips")
      .select("destination_city, destination_country, start_date, end_date, status")
      .neq("status", "archived")
      .neq("status", "completed")
      .order("start_date", { ascending: true, nullsFirst: false })
      .limit(10);

    const today = todayIso();
    const rows = data ?? [];
    const active = rows.find(
      (trip) =>
        trip.start_date &&
        trip.end_date &&
        trip.start_date <= today &&
        trip.end_date >= today,
    );
    if (active) {
      return {
        state: "travelling",
        label: "Travelling now",
        city: active.destination_city,
        country: active.destination_country,
        date: active.end_date,
        days: daysUntil(active.end_date),
      };
    }

    const next = rows.find((trip) => trip.start_date && trip.start_date > today);
    if (next?.start_date) {
      return {
        state: "upcoming",
        label: "Next departure",
        city: next.destination_city,
        country: next.destination_country,
        date: next.start_date,
        days: daysUntil(next.start_date),
      };
    }

    return {
      state: "home",
      label: "No trip planned",
      city: "At home",
      country: "Plan the next one",
      date: null,
      days: null,
    };
  } catch {
    return {
      state: "home",
      label: "No trip planned",
      city: "At home",
      country: "Plan the next one",
      date: null,
      days: null,
    };
  }
}
