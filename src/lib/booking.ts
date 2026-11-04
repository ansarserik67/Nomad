/**
 * Booking.com hotel search — validation, budgeting and URL construction.
 *
 * Important: this module never invents hotels, prices or availability. It only
 * validates the traveller's brief, does the internal arithmetic NOMAD can do
 * honestly (nights, budget per night) and builds a real Booking.com search URL.
 * All result data stays on Booking.com.
 */

export const BOOKING_SEARCH_ENDPOINT = "https://www.booking.com/searchresults.html";

/** Currencies offered in the form. Booking.com accepts ISO-4217 codes. */
export const HOTEL_CURRENCIES = [
  "KZT",
  "USD",
  "EUR",
  "GBP",
  "TRY",
  "AED",
  "GEL",
  "RUB",
  "CNY",
  "JPY",
  "KRW",
  "THB",
  "INR",
  "CAD",
  "AUD",
  "CHF",
] as const;

export const HOTEL_AMENITIES = [
  { id: "wifi", label: "Wi-Fi" },
  { id: "breakfast", label: "Breakfast" },
  { id: "pool", label: "Swimming pool" },
  { id: "parking", label: "Parking" },
  { id: "gym", label: "Gym" },
  { id: "spa", label: "Spa" },
  { id: "shuttle", label: "Airport shuttle" },
  { id: "pets", label: "Pet friendly" },
  { id: "family", label: "Family rooms" },
  { id: "kitchen", label: "Kitchen" },
] as const;

export type HotelAmenityId = (typeof HOTEL_AMENITIES)[number]["id"];

export type HotelSearchDraft = {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childrenAges: number[];
  rooms: number;
  budget: number;
  currency: string;
  /** 0 means "any rating". */
  minRating: number;
  location: string;
  amenities: string[];
  notes: string;
};

export type HotelSearchErrors = Partial<Record<keyof HotelSearchDraft, string>>;

export const EMPTY_HOTEL_SEARCH: HotelSearchDraft = {
  destination: "",
  checkIn: "",
  checkOut: "",
  adults: 2,
  children: 0,
  childrenAges: [],
  rooms: 1,
  budget: 0,
  currency: "USD",
  minRating: 0,
  location: "",
  amenities: [],
  notes: "",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function isWholeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
}

/** Number of nights between two ISO dates. Returns 0 when the range is invalid. */
export function nightCount(checkIn: string, checkOut: string): number {
  const from = parseIsoDate(checkIn);
  const to = parseIsoDate(checkOut);
  if (!from || !to) return 0;
  const nights = Math.round((to.getTime() - from.getTime()) / 86_400_000);
  return nights > 0 ? nights : 0;
}

/** Simple per-night allowance, used for the in-app hint only. */
export function nightlyBudget(total: number, nights: number): number {
  if (!Number.isFinite(total) || total <= 0 || nights <= 0) return 0;
  return total / nights;
}

export function validateHotelSearch(draft: HotelSearchDraft): HotelSearchErrors {
  const errors: HotelSearchErrors = {};

  const destination = draft.destination.trim();
  if (destination.length < 2) {
    errors.destination = "Enter a city or country.";
  } else if (destination.length > 120) {
    errors.destination = "Keep the destination under 120 characters.";
  }

  const from = parseIsoDate(draft.checkIn);
  const to = parseIsoDate(draft.checkOut);

  if (!draft.checkIn) errors.checkIn = "Choose a check-in date.";
  else if (!from) errors.checkIn = "Use a valid date.";

  if (!draft.checkOut) errors.checkOut = "Choose a check-out date.";
  else if (!to) errors.checkOut = "Use a valid date.";

  if (from && to) {
    const nights = nightCount(draft.checkIn, draft.checkOut);
    if (nights <= 0) errors.checkOut = "Check-out must be after check-in.";
    else if (nights > 60) errors.checkOut = "Booking.com searches are limited to 60 nights.";
  }

  if (!isWholeNumber(draft.adults) || draft.adults < 1 || draft.adults > 16) {
    errors.adults = "Between 1 and 16 adults.";
  }

  if (!isWholeNumber(draft.children) || draft.children < 0 || draft.children > 8) {
    errors.children = "Between 0 and 8 children.";
  }

  if (
    isWholeNumber(draft.children) &&
    draft.children > 0 &&
    draft.childrenAges.slice(0, draft.children).length !== draft.children
  ) {
    errors.childrenAges = "Add an age for every child.";
  } else {
    const badAge = draft.childrenAges
      .slice(0, Math.max(draft.children, 0))
      .find((age) => !isWholeNumber(age) || age < 0 || age > 17);
    if (badAge !== undefined) errors.childrenAges = "Child ages must be 0–17.";
  }

  if (!isWholeNumber(draft.rooms) || draft.rooms < 1 || draft.rooms > 8) {
    errors.rooms = "Between 1 and 8 rooms.";
  }

  if (!Number.isFinite(draft.budget) || draft.budget < 0 || draft.budget > 10_000_000) {
    errors.budget = "Enter a budget of 0 or more.";
  }

  if (!/^[A-Z]{3}$/.test(draft.currency)) {
    errors.currency = "Pick a currency.";
  }

  if (draft.location.trim().length > 120) {
    errors.location = "Keep the preferred area under 120 characters.";
  }

  if (draft.notes.trim().length > 500) {
    errors.notes = "Keep the extra notes under 500 characters.";
  }

  return errors;
}

/**
 * Builds the Booking.com search URL.
 *
 * Only parameters Booking.com documents for its search page are sent:
 *   ss, checkin, checkout, group_adults, group_children, age, no_rooms
 *
 * Budget, rating, amenities and area preferences are deliberately NOT encoded:
 * there is no verified URL parameter for them, so the traveller applies those
 * filters on Booking.com itself. Nothing here guesses a hotel URL.
 */
export function buildBookingSearchUrl(draft: HotelSearchDraft): string {
  const params = new URLSearchParams();
  params.set("ss", draft.destination.trim());
  params.set("checkin", draft.checkIn);
  params.set("checkout", draft.checkOut);
  params.set("group_adults", String(draft.adults));
  params.set("group_children", String(draft.children));

  if (draft.children > 0) {
    for (const age of draft.childrenAges.slice(0, draft.children)) {
      params.append("age", String(age));
    }
  }

  params.set("no_rooms", String(draft.rooms));

  return `${BOOKING_SEARCH_ENDPOINT}?${params.toString()}`;
}

/** Preference labels the traveller must re-apply on Booking.com. */
export function filtersToApplyOnBooking(draft: HotelSearchDraft): string[] {
  const list: string[] = [];
  if (draft.minRating > 0) list.push(`${draft.minRating}+ rating`);
  if (draft.location.trim()) list.push(`area: ${draft.location.trim()}`);
  for (const amenity of draft.amenities) {
    const match = HOTEL_AMENITIES.find((item) => item.id === amenity);
    if (match) list.push(match.label);
  }
  if (draft.budget > 0) list.push(`budget ${draft.currency} ${Math.round(draft.budget)}`);
  return list;
}
