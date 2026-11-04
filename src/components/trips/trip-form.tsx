"use client";

import { CalendarDays, MapPin, Plane, Users, Wallet } from "lucide-react";
import { useActionState } from "react";

import { createTripAction } from "@/app/(app)/planner/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { initialTripFormState } from "@/lib/form-state";

const CURRENCIES = [
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
  "SEK",
  "SGD",
  "ZAR",
  "AED",
  "THB",
  "TRY",
  "BRL",
];

export type TripDefaults = {
  city?: string;
  country?: string;
  countryCode?: string;
  lat?: number;
  lng?: number;
  currency?: string;
  title?: string;
};

export function TripForm({
  configured,
  defaults,
}: {
  configured: boolean;
  defaults?: TripDefaults;
}) {
  const [state, action, pending] = useActionState(createTripAction, initialTripFormState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {state.message ? (
        <p
          role="alert"
          className="rounded-[14px] border border-danger/25 bg-danger/[0.07] px-3.5 py-3 text-[12px] leading-relaxed text-danger"
        >
          {state.message}
        </p>
      ) : null}

      {!configured ? (
        <p className="rounded-[14px] border border-warning/25 bg-warning/[0.06] px-3.5 py-3 text-[12px] leading-relaxed text-warning">
          Supabase is not connected, so trips cannot be saved yet. Add your project keys
          to enable this form.
        </p>
      ) : null}

      <Field label="Trip name" htmlFor="title" error={errors.title}>
        <Input
          id="title"
          name="title"
          placeholder="Spring in Kyoto"
          defaultValue={defaults?.title ?? ""}
          required
          disabled={!configured}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Hidden so the fields keep a stable server contract. */}
        <Field label="Destination city" htmlFor="destinationCity" error={errors.destinationCity}>
          <Input
            id="destinationCity"
            name="destinationCity"
            placeholder="Kyoto"
            defaultValue={defaults?.city ?? ""}
            leadingIcon={<MapPin className="size-4" />}
            required
            disabled={!configured}
          />
        </Field>
        <Field label="Country" htmlFor="destinationCountry" error={errors.destinationCountry}>
          <Input
            id="destinationCountry"
            name="destinationCountry"
            placeholder="Japan"
            defaultValue={defaults?.country ?? ""}
            required
            disabled={!configured}
          />
        </Field>
        <Field
          label="Country code"
          htmlFor="destinationCountryCode"
          error={errors.destinationCountryCode}
          optional
        >
          <Input
            id="destinationCountryCode"
            name="destinationCountryCode"
            placeholder="JP"
            maxLength={2}
            defaultValue={defaults?.countryCode ?? ""}
            className="uppercase"
            disabled={!configured}
          />
        </Field>
        <Field label="Travellers" htmlFor="travelers" error={errors.travelers}>
          <Input
            id="travelers"
            name="travelers"
            type="number"
            min={1}
            max={50}
            defaultValue={1}
            leadingIcon={<Users className="size-4" />}
            disabled={!configured}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" htmlFor="startDate" error={errors.startDate} optional>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            disabled={!configured}
            className="[color-scheme:dark]"
          />
        </Field>
        <Field label="End date" htmlFor="endDate" error={errors.endDate} optional>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            disabled={!configured}
            className="[color-scheme:dark]"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Budget" htmlFor="budgetAmount" error={errors.budgetAmount}>
          <Input
            id="budgetAmount"
            name="budgetAmount"
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            leadingIcon={<Wallet className="size-4" />}
            disabled={!configured}
          />
        </Field>
        <Field label="Currency" htmlFor="currency" error={errors.currency}>
          <Select
            id="currency"
            name="currency"
            defaultValue={defaults?.currency ?? "USD"}
            disabled={!configured}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes" error={errors.notes} optional>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Who is coming, what matters most, anything the assistant should know…"
          disabled={!configured}
        />
      </Field>

      <details className="rounded-[14px] border border-line bg-surface-1 px-3.5 py-2.5">
        <summary className="cursor-pointer list-none text-[11.5px] font-medium text-muted marker:hidden">
          Map coordinates (optional)
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Latitude" htmlFor="destinationLat" error={errors.destinationLat}>
            <Input
              id="destinationLat"
              name="destinationLat"
              type="number"
              step="any"
              placeholder="35.0116"
              defaultValue={defaults?.lat}
              disabled={!configured}
            />
          </Field>
          <Field label="Longitude" htmlFor="destinationLng" error={errors.destinationLng}>
            <Input
              id="destinationLng"
              name="destinationLng"
              type="number"
              step="any"
              placeholder="135.7681"
              defaultValue={defaults?.lng}
              disabled={!configured}
            />
          </Field>
        </div>
      </details>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="inline-flex items-center gap-1.5 text-[10.5px] text-muted-2">
          <CalendarDays className="size-3" />
          You can add the daily itinerary next.
        </p>
        <Button type="submit" loading={pending} disabled={!configured}>
          <Plane className="size-4" /> Create trip
        </Button>
      </div>
    </form>
  );
}
