import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(
  amount: number | string | null | undefined,
  currency = "USD",
  options: { compact?: boolean; maximumFractionDigits?: number } = {},
  locale = "en",
) {
  const value = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: options.compact ? "compact" : "standard",
      maximumFractionDigits:
        options.maximumFractionDigits ?? (options.compact ? 1 : value % 1 === 0 ? 0 : 2),
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatDate(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
  locale = "en",
) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(date);
}

export function formatShortDate(value: string | null | undefined, locale = "en") {
  return formatDate(value, { day: "numeric", month: "short" }, locale);
}

export function formatDateRange(start: string | null, end: string | null, locale = "en") {
  if (!start && !end) return "—";
  if (start && !end) return formatShortDate(start, locale);
  if (!start && end) return formatShortDate(end, locale);
  const startDate = new Date(start as string);
  const endDate = new Date(end as string);
  const sameMonth = startDate.getUTCMonth() === endDate.getUTCMonth();
  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();
  if (sameMonth && sameYear) {
    return `${formatDate(start, { day: "numeric" }, locale)} – ${formatDate(
      end,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
      locale,
    )}`;
  }
  return `${formatDate(start, { day: "numeric", month: "short" }, locale)} – ${formatDate(
    end,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
    locale,
  )}`;
}

export function nightsBetween(start: string | null, end: string | null) {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function daysUntil(date: string | null) {
  if (!date) return null;
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const target = new Date(`${date}T00:00:00Z`).getTime();
  return Math.round((target - todayUtc) / 86_400_000);
}

export function currentUtcDayStart(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function initials(name: string | null | undefined, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "N";
  return source
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function relativeTime(value: string | null | undefined, locale = "en") {
  if (!value) return "—";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60_000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return formatter.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return formatter.format(-days, "day");
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return formatter.format(-months, "month");
  return formatter.format(-Math.round(months / 12), "year");
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const TRIP_STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  upcoming: "Upcoming",
  active: "In progress",
  completed: "Completed",
  archived: "Archived",
};

export const EXPENSE_CATEGORY_LABEL: Record<string, string> = {
  flights: "Flights",
  stay: "Stay",
  food: "Food & drink",
  transport: "Transport",
  activities: "Activities",
  shopping: "Shopping",
  other: "Other",
};

export function safeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
