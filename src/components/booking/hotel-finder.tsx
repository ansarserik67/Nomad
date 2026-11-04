"use client";

import { BedDouble, CalendarDays, ExternalLink, Info, Moon, Users, Wallet } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { GlassCard } from "@/components/ui/glass-card";
import {
  buildBookingSearchUrl,
  EMPTY_HOTEL_SEARCH,
  filtersToApplyOnBooking,
  HOTEL_AMENITIES,
  HOTEL_CURRENCIES,
  nightlyBudget,
  nightCount,
  validateHotelSearch,
  type HotelSearchDraft,
  type HotelSearchErrors,
} from "@/lib/booking";
import { format } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type SearchResult = {
  url: string;
  nights: number;
  perNight: number;
  filters: string[];
};

function money(amount: number, currency: string, locale: string) {
  if (amount <= 0) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

export function HotelFinder() {
  const { t, translate, locale } = useI18n();
  const [draft, setDraft] = useState<HotelSearchDraft>(EMPTY_HOTEL_SEARCH);
  const [errors, setErrors] = useState<HotelSearchErrors>({});
  const [result, setResult] = useState<SearchResult | null>(null);

  const ratingOptions = [0, 3, 3.5, 4, 4.5].map((value) => ({
    value,
    label:
      value === 0
        ? t.hotels.anyRating
        : format(t.hotels.stars, { stars: value }),
  }));

  const amenityLabels: Record<string, string> = {
    wifi: t.hotels.amenityWifi,
    breakfast: t.hotels.amenityBreakfast,
    pool: t.hotels.amenityPool,
    parking: t.hotels.amenityParking,
    gym: t.hotels.amenityGym,
    spa: t.hotels.amenitySpa,
    shuttle: t.hotels.amenityShuttle,
    pets: t.hotels.amenityPets,
    family: t.hotels.amenityFamily,
    kitchen: t.hotels.amenityKitchen,
  };

  const nights = useMemo(
    () => nightCount(draft.checkIn, draft.checkOut),
    [draft.checkIn, draft.checkOut],
  );
  const perNight = useMemo(
    () => nightlyBudget(draft.budget, nights),
    [draft.budget, nights],
  );

  const nightsLabel = (count: number) =>
    count === 1
      ? format(t.hotels.nightCountOne, { count })
      : format(t.hotels.nightCount, { count });

  function update<K extends keyof HotelSearchDraft>(key: K, value: HotelSearchDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setResult(null);
  }

  function setChildren(count: number) {
    const safe = Number.isFinite(count) ? Math.max(0, Math.min(8, count)) : 0;
    setDraft((current) => {
      const ages = Array.from({ length: safe }, (_, index) => current.childrenAges[index] ?? 8);
      return { ...current, children: safe, childrenAges: ages };
    });
    setErrors((current) => ({ ...current, children: undefined, childrenAges: undefined }));
    setResult(null);
  }

  function toggleAmenity(id: string) {
    setDraft((current) => ({
      ...current,
      amenities: current.amenities.includes(id)
        ? current.amenities.filter((item) => item !== id)
        : [...current.amenities, id],
    }));
    setResult(null);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateHotelSearch(draft);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setResult(null);
      return;
    }

    const url = buildBookingSearchUrl(draft);
    const totalNights = nightCount(draft.checkIn, draft.checkOut);

    // Opened synchronously inside the submit handler so the browser treats it
    // as a user gesture. The link below is the fallback if a blocker steps in.
    window.open(url, "_blank", "noopener,noreferrer");

    setResult({
      url,
      nights: totalNights,
      perNight: nightlyBudget(draft.budget, totalNights),
      filters: filtersToApplyOnBooking(draft),
    });
  }

  const guestSummary = [
    format(t.hotels.adultsCount, { count: draft.adults }),
    draft.children > 0
      ? format(t.hotels.childrenCount, { count: draft.children })
      : null,
    format(t.hotels.roomsCount, { count: draft.rooms }),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field
          label={t.hotels.destination}
          htmlFor="hotelDestination"
          error={translate(errors.destination)}
          hint={t.hotels.destinationHint}
        >
          <Input
            id="hotelDestination"
            name="destination"
            placeholder={t.hotels.destinationPlaceholder}
            value={draft.destination}
            onChange={(event) => update("destination", event.target.value)}
            leadingIcon={<BedDouble className="size-4" />}
            autoComplete="off"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t.hotels.checkIn}
            htmlFor="hotelCheckIn"
            error={translate(errors.checkIn)}
          >
            <Input
              id="hotelCheckIn"
              name="checkIn"
              type="date"
              value={draft.checkIn}
              onChange={(event) => update("checkIn", event.target.value)}
              required
            />
          </Field>
          <Field
            label={t.hotels.checkOut}
            htmlFor="hotelCheckOut"
            error={translate(errors.checkOut)}
          >
            <Input
              id="hotelCheckOut"
              name="checkOut"
              type="date"
              value={draft.checkOut}
              min={draft.checkIn || undefined}
              onChange={(event) => update("checkOut", event.target.value)}
              required
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t.hotels.adults} htmlFor="hotelAdults" error={translate(errors.adults)}>
            <Input
              id="hotelAdults"
              name="adults"
              type="number"
              min={1}
              max={16}
              value={draft.adults}
              onChange={(event) => update("adults", Number(event.target.value || 1))}
            />
          </Field>
          <Field
            label={t.hotels.children}
            htmlFor="hotelChildren"
            error={translate(errors.children)}
          >
            <Input
              id="hotelChildren"
              name="children"
              type="number"
              min={0}
              max={8}
              value={draft.children}
              onChange={(event) => setChildren(Number(event.target.value || 0))}
            />
          </Field>
          <Field label={t.hotels.rooms} htmlFor="hotelRooms" error={translate(errors.rooms)}>
            <Input
              id="hotelRooms"
              name="rooms"
              type="number"
              min={1}
              max={8}
              value={draft.rooms}
              onChange={(event) => update("rooms", Number(event.target.value || 1))}
            />
          </Field>
        </div>

        {draft.children > 0 ? (
          <Field
            label={t.hotels.childrenAges}
            error={translate(errors.childrenAges)}
            hint={t.hotels.childrenAgesHint}
          >
            <div className="flex flex-wrap gap-2">
              {draft.childrenAges.map((age, index) => (
                <Input
                  key={`child-${index}`}
                  aria-label={format(t.hotels.childAgeLabel, { index: index + 1 })}
                  type="number"
                  min={0}
                  max={17}
                  value={age}
                  className="h-11 w-20"
                  onChange={(event) => {
                    const next = [...draft.childrenAges];
                    next[index] = Number(event.target.value || 0);
                    setDraft((current) => ({ ...current, childrenAges: next }));
                    setErrors((current) => ({ ...current, childrenAges: undefined }));
                    setResult(null);
                  }}
                />
              ))}
            </div>
          </Field>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-[1.4fr_0.6fr]">
          <Field
            label={t.hotels.totalBudget}
            htmlFor="hotelBudget"
            error={translate(errors.budget)}
            optional
            hint={
              nights > 0 && draft.budget > 0
                ? format(t.hotels.budgetPerNightHint, {
                    amount: money(perNight, draft.currency, locale),
                    nights,
                  })
                : t.hotels.budgetHintOnly
            }
          >
            <Input
              id="hotelBudget"
              name="budget"
              type="number"
              min={0}
              step={1}
              placeholder="600"
              value={draft.budget || ""}
              onChange={(event) => update("budget", Number(event.target.value || 0))}
              leadingIcon={<Wallet className="size-4" />}
            />
          </Field>
          <Field
            label={t.common.currency}
            htmlFor="hotelCurrency"
            error={translate(errors.currency)}
          >
            <Select
              id="hotelCurrency"
              name="currency"
              value={draft.currency}
              onChange={(event) => update("currency", event.target.value)}
            >
              {HOTEL_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.hotels.rating} htmlFor="hotelRating" optional>
            <Select
              id="hotelRating"
              name="minRating"
              value={String(draft.minRating)}
              onChange={(event) => update("minRating", Number(event.target.value))}
            >
              {ratingOptions.map((rating) => (
                <option key={rating.value} value={rating.value}>
                  {rating.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={t.hotels.location}
            htmlFor="hotelLocation"
            error={translate(errors.location)}
            optional
            hint={t.hotels.locationHint}
          >
            <Input
              id="hotelLocation"
              name="location"
              placeholder={t.hotels.locationPlaceholder}
              value={draft.location}
              onChange={(event) => update("location", event.target.value)}
            />
          </Field>
        </div>

        <Field label={t.hotels.amenities} optional>
          <div className="flex flex-wrap gap-2">
            {HOTEL_AMENITIES.map((amenity) => {
              const active = draft.amenities.includes(amenity.id);
              return (
                <button
                  key={amenity.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleAmenity(amenity.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
                    active
                      ? "border-accent/40 bg-accent/15 text-paper"
                      : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-paper",
                  )}
                >
                  {amenityLabels[amenity.id] ?? amenity.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field
          label={t.hotels.notes}
          htmlFor="hotelNotes"
          error={translate(errors.notes)}
          optional
          hint={t.hotels.notesHint}
        >
          <Textarea
            id="hotelNotes"
            name="notes"
            placeholder={t.hotels.notesPlaceholder}
            value={draft.notes}
            onChange={(event) => update("notes", event.target.value)}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-line bg-surface-1 px-4 py-3">
          <span className="flex items-center gap-2 text-[12.5px] text-muted">
            <Moon className="size-3.5 text-accent" />
            {nights > 0 ? nightsLabel(nights) : t.hotels.datesNotSet}
          </span>
          <span className="flex items-center gap-2 text-[12.5px] text-muted">
            <Users className="size-3.5 text-teal" />
            {guestSummary}
          </span>
          <span className="flex items-center gap-2 text-[12.5px] text-muted">
            <CalendarDays className="size-3.5 text-accent" />
            {draft.budget > 0 && perNight > 0
              ? format(t.hotels.perNightShort, {
                  amount: money(perNight, draft.currency, locale),
                })
              : t.hotels.budgetNotSet}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg">
            <BedDouble className="size-4" />
            {t.hotels.searchHotels}
          </Button>
          <span className="text-[12px] text-muted-2">{t.hotels.opensBooking}</span>
        </div>
      </form>

      {result ? (
        <GlassCard tone="accent" className="space-y-3">
          <div className="flex items-start gap-3">
            <ExternalLink className="mt-0.5 size-4 shrink-0 text-accent" />
            <div className="min-w-0 space-y-1">
              <p className="text-[13.5px] font-medium text-paper">{t.hotels.bookingOpening}</p>
              <p className="text-[12.5px] leading-relaxed text-muted">
                {t.hotels.bookingExplanation}
              </p>
            </div>
          </div>

          <div className="grid gap-2 rounded-[14px] border border-line bg-surface-1 p-3 text-[12.5px] text-muted sm:grid-cols-2">
            <span>
              {nightsLabel(result.nights)} · {guestSummary}
            </span>
            <span>
              {format(t.hotels.budgetPerNightResult, {
                amount: money(result.perNight, draft.currency, locale),
              })}
            </span>
          </div>

          {result.filters.length > 0 ? (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-[12px] text-muted-2">
                <Info className="size-3.5" />
                {t.hotels.applyFilters}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {result.filters.map((filter) => (
                  <li
                    key={filter}
                    className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[12px] text-muted"
                  >
                    {filter}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <a
            href={result.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-accent hover:text-accent-soft"
          >
            {t.hotels.openSearchAgain}
            <ExternalLink className="size-3.5" />
          </a>
        </GlassCard>
      ) : null}
    </div>
  );
}
