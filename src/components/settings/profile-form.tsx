"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { initialProfileState } from "@/lib/form-state";
import type { Profile } from "@/lib/database.types";
import { useI18n } from "@/lib/i18n/provider";

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

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const { t, translate } = useI18n();
  const [state, action, pending] = useActionState(
    updateProfileAction,
    initialProfileState,
  );

  const styles = [
    { value: "slow", label: t.profile.styleSlow },
    { value: "balanced", label: t.profile.styleBalanced },
    { value: "fast", label: t.profile.styleFast },
    { value: "luxury", label: t.profile.styleLuxury },
    { value: "budget", label: t.profile.styleBudget },
  ];

  return (
    <form action={action} className="space-y-4">
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "error"
              ? "rounded-[12px] border border-danger/25 bg-danger/[0.07] px-3 py-2 text-[11.5px] text-danger"
              : "rounded-[12px] border border-positive/25 bg-positive/[0.07] px-3 py-2 text-[11.5px] text-positive"
          }
        >
          {translate(state.message) ?? state.message}
        </p>
      ) : null}

      <Field
        label={t.profile.fullName}
        htmlFor="fullName"
        error={translate(state.fieldErrors?.fullName)}
      >
        <Input
          id="fullName"
          name="fullName"
          defaultValue={profile?.full_name ?? ""}
          placeholder={t.auth.namePlaceholder}
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.profile.homeCity}
          htmlFor="homeCity"
          error={translate(state.fieldErrors?.homeCity)}
          optional
        >
          <Input
            id="homeCity"
            name="homeCity"
            defaultValue={profile?.home_city ?? ""}
            placeholder={t.profile.homeCityPlaceholder}
          />
        </Field>
        <Field
          label={t.profile.homeCountry}
          htmlFor="homeCountry"
          error={translate(state.fieldErrors?.homeCountry)}
          optional
        >
          <Input
            id="homeCountry"
            name="homeCountry"
            defaultValue={profile?.home_country ?? ""}
            placeholder={t.profile.homeCountryPlaceholder}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t.profile.homeCurrency}
          htmlFor="homeCurrency"
          error={translate(state.fieldErrors?.homeCurrency)}
          hint={t.profile.homeCurrencyHint}
        >
          <Select
            id="homeCurrency"
            name="homeCurrency"
            defaultValue={profile?.home_currency ?? "USD"}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t.profile.travelStyle}
          htmlFor="travelStyle"
          error={translate(state.fieldErrors?.travelStyle)}
        >
          <Select
            id="travelStyle"
            name="travelStyle"
            defaultValue={profile?.travel_style ?? "balanced"}
          >
            {styles.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" size="md" loading={pending}>
          {t.profile.saveProfile}
        </Button>
      </div>
    </form>
  );
}
