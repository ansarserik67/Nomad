"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";
import { destinationSaveSchema } from "@/lib/validation";

export type SaveDestinationResult = { saved: boolean; error?: string };

export async function toggleSavedDestination(input: {
  city: string;
  country: string;
  countryCode: string;
  lat?: number;
  lng?: number;
}): Promise<SaveDestinationResult> {
  const parsed = destinationSaveSchema.safeParse(input);
  if (!parsed.success) return { saved: false, error: "That destination could not be saved." };

  const { supabase, viewer } = await requireAuth();
  const { city, country, countryCode, lat, lng } = parsed.data;

  const { data: existing, error: lookupError } = await supabase
    .from("saved_destinations")
    .select("id")
    .eq("user_id", viewer.id)
    .eq("city", city)
    .eq("country_code", countryCode)
    .maybeSingle();

  if (lookupError) return { saved: false, error: "Could not reach your saved list." };

  if (existing) {
    const { error } = await supabase.from("saved_destinations").delete().eq("id", existing.id);
    if (error) return { saved: true, error: "Could not remove that destination." };
    revalidatePath("/discover");
    revalidatePath("/dashboard");
    return { saved: false };
  }

  const { error } = await supabase.from("saved_destinations").insert({
    user_id: viewer.id,
    city,
    country,
    country_code: countryCode,
    lat: lat ?? null,
    lng: lng ?? null,
  });

  if (error) return { saved: false, error: "Could not save that destination." };

  revalidatePath("/discover");
  revalidatePath("/dashboard");
  return { saved: true };
}
