"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth";
import { findDestination } from "@/lib/destinations";
import type { TripFormState } from "@/lib/form-state";
import { translateFieldErrors, translateMessage } from "@/lib/i18n/server";
import { fieldErrors, tripSchema } from "@/lib/validation";

function hueFor(city: string, countryCode?: string) {
  const match = findDestination(city, countryCode);
  if (match) return match.hue;
  let hash = 0;
  for (const character of city) hash = (hash * 31 + character.charCodeAt(0)) % 360;
  return hash;
}

export async function createTripAction(
  _previous: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const parsed = tripSchema.safeParse({
    title: formData.get("title"),
    destinationCity: formData.get("destinationCity"),
    destinationCountry: formData.get("destinationCountry"),
    destinationCountryCode: formData.get("destinationCountryCode") ?? undefined,
    destinationLat: formData.get("destinationLat") || undefined,
    destinationLng: formData.get("destinationLng") || undefined,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    travelers: formData.get("travelers") ?? 1,
    budgetAmount: formData.get("budgetAmount") || 0,
    currency: formData.get("currency") || "USD",
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: await translateFieldErrors(fieldErrors(parsed.error)),
      message: "Please check the highlighted fields.",
    };
  }

  const { supabase, viewer } = await requireAuth();
  const values = parsed.data;

  const { data, error } = await supabase
    .from("trips")
    .insert({
      owner_id: viewer.id,
      title: values.title,
      destination_city: values.destinationCity,
      destination_country: values.destinationCountry,
      destination_country_code: values.destinationCountryCode ?? null,
      destination_lat: values.destinationLat ?? null,
      destination_lng: values.destinationLng ?? null,
      start_date: values.startDate ?? null,
      end_date: values.endDate ?? null,
      travelers: values.travelers,
      budget_amount: values.budgetAmount,
      currency: values.currency,
      status: "planning",
      cover_hue: hueFor(values.destinationCity, values.destinationCountryCode),
      notes: values.notes,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createTripAction", error);
    return {
      status: "error",
      message:
        await translateMessage("The trip could not be created. Check that the database migration has been applied and try again."),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/trips");
  revalidatePath("/planner");
  revalidatePath("/wallet");
  redirect(`/trips/${data.id}?created=1`);
}
