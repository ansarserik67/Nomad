import "server-only";

import type { ServerSupabaseClient } from "@/lib/supabase/server";
import { daysUntil, formatDate, todayIso } from "@/lib/utils";

export type AppNotification = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "accent" | "teal" | "warning" | "danger";
};

export async function getNotifications(
  supabase: ServerSupabaseClient,
): Promise<AppNotification[]> {
  try {
    const today = todayIso();
    const [tripsResult, documentsResult] = await Promise.all([
      supabase
        .from("trips")
        .select("id, title, destination_city, start_date, end_date, status")
        .neq("status", "archived")
        .order("start_date", { ascending: true, nullsFirst: false })
        .limit(20),
      supabase
        .from("documents")
        .select("id, title, expires_on")
        .not("expires_on", "is", null)
        .gte("expires_on", today)
        .order("expires_on", { ascending: true })
        .limit(5),
    ]);

    const notifications: AppNotification[] = [];

    for (const trip of tripsResult.data ?? []) {
      const days = daysUntil(trip.start_date);
      if (days !== null && days >= 0 && days <= 21) {
        notifications.push({
          id: `trip-soon-${trip.id}`,
          title: days === 0 ? `You leave for ${trip.destination_city} today` : `${trip.destination_city} in ${days} day${days === 1 ? "" : "s"}`,
          detail: trip.start_date
            ? `Departure ${formatDate(trip.start_date, { day: "numeric", month: "long" })}`
            : "Check your itinerary",
          href: `/trips/${trip.id}`,
          tone: "accent",
        });
      }
      if (
        trip.status === "planning" &&
        (!trip.start_date || !trip.end_date) &&
        notifications.length < 3
      ) {
        notifications.push({
          id: `trip-dates-${trip.id}`,
          title: `Add dates to ${trip.title}`,
          detail: "Itineraries and reminders need a date range.",
          href: `/trips/${trip.id}?tab=plan`,
          tone: "warning",
        });
      }
    }

    for (const document of documentsResult.data ?? []) {
      const days = daysUntil(document.expires_on);
      if (days !== null && days <= 60) {
        notifications.push({
          id: `document-${document.id}`,
          title: `${document.title} expires soon`,
          detail:
            days <= 0
              ? "This document has already expired."
              : `Valid for another ${days} day${days === 1 ? "" : "s"}.`,
          href: "/vault",
          tone: days <= 14 ? "danger" : "warning",
        });
      }
    }

    return notifications.slice(0, 5);
  } catch {
    return [];
  }
}
