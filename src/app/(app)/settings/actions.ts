"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";
import type { ProfileFormState } from "@/lib/form-state";
import { translateMessage, translateFieldErrors } from "@/lib/i18n/server";
import { fieldErrors, profileSchema } from "@/lib/validation";

export async function updateProfileAction(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    homeCity: formData.get("homeCity") ?? undefined,
    homeCountry: formData.get("homeCountry") ?? undefined,
    homeCurrency: formData.get("homeCurrency") ?? "USD",
    travelStyle: formData.get("travelStyle") ?? "balanced",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: await translateMessage("Please check the highlighted fields."),
      fieldErrors: await translateFieldErrors(fieldErrors(parsed.error)),
    };
  }

  const { supabase, viewer } = await requireAuth();
  const values = parsed.data;

  const { error } = await supabase.from("profiles").upsert(
    {
      id: viewer.id,
      email: viewer.email,
      full_name: values.fullName,
      home_city: values.homeCity,
      home_country: values.homeCountry,
      home_currency: values.homeCurrency,
      travel_style: values.travelStyle,
      onboarded: true,
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("updateProfileAction", error);
    return {
      status: "error",
      message: await translateMessage(
        "Your profile could not be saved. Confirm the database migration has been applied.",
      ),
    };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { status: "success", message: await translateMessage("Profile updated.") };
}
