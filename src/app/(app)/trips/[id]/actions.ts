"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";
import type { ActionState } from "@/lib/form-state";
import { format } from "@/lib/i18n/dictionaries";
import { translateFieldErrors, translateMessage } from "@/lib/i18n/server";
import {
  expenseSchema,
  fieldErrors,
  inviteSchema,
  isUuid,
  itinerarySchema,
} from "@/lib/validation";

function revalidateTrip(tripId: string) {
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  revalidatePath("/dashboard");
  revalidatePath("/wallet");
  revalidatePath("/group");
  revalidatePath("/vault");
}

export async function addItineraryAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = itinerarySchema.safeParse({
    tripId: formData.get("tripId"),
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    category: formData.get("category") ?? "activity",
    dayDate: formData.get("dayDate") ?? undefined,
    startTime: formData.get("startTime") ?? undefined,
    locationName: formData.get("locationName") ?? undefined,
    costAmount: formData.get("costAmount") || 0,
    currency: formData.get("currency") || "USD",
    status: formData.get("status") ?? "planned",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: await translateFieldErrors(fieldErrors(parsed.error)),
    };
  }

  const { supabase, viewer } = await requireAuth();
  const item = parsed.data;

  const { error } = await supabase.from("itinerary_items").insert({
    trip_id: item.tripId,
    created_by: viewer.id,
    title: item.title,
    description: item.description,
    category: item.category,
    day_date: item.dayDate ?? null,
    start_time: item.startTime ?? null,
    location_name: item.locationName,
    cost_amount: item.costAmount,
    currency: item.currency,
    status: item.status,
  });

  if (error) {
    console.error("addItineraryAction", error);
    return {
      status: "error",
      message:
        await translateMessage("The activity could not be saved. You may not have edit access to this trip."),
    };
  }

  revalidateTrip(item.tripId);
  return { status: "success", message: await translateMessage("Activity added to the itinerary.") };
}

export async function deleteItineraryAction(
  itemId: string,
  tripId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isUuid(itemId) || !isUuid(tripId)) {
    return { ok: false, error: await translateMessage("Invalid identifier.") };
  }

  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from("itinerary_items")
    .delete()
    .eq("id", itemId)
    .eq("trip_id", tripId);
  if (error) return { ok: false, error: await translateMessage("Could not remove that activity.") };
  revalidateTrip(tripId);
  return { ok: true };
}

export async function addExpenseAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = expenseSchema.safeParse({
    tripId: formData.get("tripId"),
    title: formData.get("title"),
    category: formData.get("category") ?? "other",
    amount: formData.get("amount"),
    currency: formData.get("currency") || "USD",
    exchangeRate: formData.get("exchangeRate") || 1,
    spentOn: formData.get("spentOn"),
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: await translateFieldErrors(fieldErrors(parsed.error)),
    };
  }

  const { supabase, viewer } = await requireAuth();
  const expense = parsed.data;

  const { error } = await supabase.from("expenses").insert({
    trip_id: expense.tripId,
    created_by: viewer.id,
    title: expense.title,
    category: expense.category,
    amount: expense.amount,
    currency: expense.currency,
    exchange_rate: expense.exchangeRate,
    spent_on: expense.spentOn,
    notes: expense.notes,
  });

  if (error) {
    console.error("addExpenseAction", error);
    return { status: "error", message: await translateMessage("The expense could not be saved.") };
  }

  revalidateTrip(expense.tripId);
  return { status: "success", message: await translateMessage("Expense recorded.") };
}

export async function deleteExpenseAction(
  expenseId: string,
  tripId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isUuid(expenseId) || !isUuid(tripId)) {
    return { ok: false, error: await translateMessage("Invalid identifier.") };
  }

  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("trip_id", tripId);
  if (error) return { ok: false, error: await translateMessage("Could not remove that expense.") };
  revalidateTrip(tripId);
  return { ok: true };
}

export async function inviteMemberAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = inviteSchema.safeParse({
    tripId: formData.get("tripId"),
    email: formData.get("email"),
    role: formData.get("role") ?? "viewer",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: await translateMessage("Enter a valid email address and role."),
      fieldErrors: await translateFieldErrors(fieldErrors(parsed.error)),
    };
  }

  const { supabase } = await requireAuth();
  const { tripId, email, role } = parsed.data;

  const { data, error } = await supabase.rpc("invite_trip_member", {
    p_trip_id: tripId,
    p_email: email,
    p_role: role,
  });

  if (error) {
    console.error("inviteMemberAction", error);
    return {
      status: "error",
      message:
        error.message.includes("only the trip owner")
          ? await translateMessage("Only the trip owner can invite members.")
          : await translateMessage("The invitation could not be sent. Check that the database migration is applied."),
    };
  }

  const result = data as { status?: string } | null;
  revalidateTrip(tripId);

  return {
    status: "success",
    message:
      result?.status === "pending"
        ? format(await translateMessage("Invitation saved for {email}. It activates when they create their account."), { email })
        : format(await translateMessage("{email} now has access to this trip."), { email }),
  };
}

export async function removeMemberAction(
  memberId: string,
  tripId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isUuid(memberId) || !isUuid(tripId)) {
    return { ok: false, error: await translateMessage("Invalid identifier.") };
  }

  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from("trip_members")
    .delete()
    .eq("id", memberId)
    .eq("trip_id", tripId);
  if (error) return { ok: false, error: await translateMessage("Could not remove that member.") };
  revalidateTrip(tripId);
  return { ok: true };
}

const ALLOWED_TYPES = new Map<string, string>([
  ["application/pdf", "pdf"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["text/plain", "txt"],
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function uploadDocumentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get("file");
  const tripIdRaw = String(formData.get("tripId") ?? "");
  const tripId = tripIdRaw || null;
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "other");
  const expiresOn = String(formData.get("expiresOn") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: await translateMessage("Choose a file to upload.") };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { status: "error", message: await translateMessage("Files must be 10 MB or smaller.") };
  }
  const extension = ALLOWED_TYPES.get(file.type);
  if (!extension) {
    return {
      status: "error",
      message: await translateMessage("Please upload a PDF, JPG, PNG, WEBP or TXT file."),
    };
  }
  if (title.length < 1 || title.length > 140) {
    return { status: "error", message: await translateMessage("Give the document a title (140 characters max).") };
  }
  if (
    !["ticket", "booking", "passport", "insurance", "receipt", "other"].includes(category)
  ) {
    return { status: "error", message: await translateMessage("Choose a valid document category.") };
  }
  if (expiresOn && !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn)) {
    return { status: "error", message: await translateMessage("Use a valid expiry date.") };
  }
  if (tripId !== null && !/^[0-9a-f-]{36}$/i.test(tripId)) {
    return { status: "error", message: await translateMessage("Invalid trip.") };
  }

  const { supabase, viewer } = await requireAuth();
  const path = `${viewer.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("travel-documents")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("uploadDocumentAction:storage", uploadError);
    return {
      status: "error",
      message:
        await translateMessage("The file could not be uploaded. Confirm the travel-documents storage bucket exists."),
    };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    owner_id: viewer.id,
    trip_id: tripId,
    title,
    category: category as "ticket" | "booking" | "passport" | "insurance" | "receipt" | "other",
    file_path: path,
    file_name: file.name.slice(0, 200),
    mime_type: file.type,
    file_size: file.size,
    expires_on: expiresOn || null,
    notes: notes || null,
  });

  if (insertError) {
    console.error("uploadDocumentAction:insert", insertError);
    await supabase.storage.from("travel-documents").remove([path]);
    return { status: "error", message: await translateMessage("The document record could not be created.") };
  }

  if (tripId) revalidateTrip(tripId);
  else revalidatePath("/vault");
  return { status: "success", message: await translateMessage("Document filed in the vault.") };
}

export async function deleteDocumentAction(
  documentId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isUuid(documentId)) {
    return { ok: false, error: await translateMessage("Invalid identifier.") };
  }

  const { supabase, viewer } = await requireAuth();

  const { data: document } = await supabase
    .from("documents")
    .select("id, owner_id, file_path, trip_id")
    .eq("id", documentId)
    .maybeSingle();

  if (!document) return { ok: false, error: await translateMessage("Document not found.") };
  if (document.owner_id !== viewer.id) {
    return { ok: false, error: await translateMessage("Only the owner can delete this document.") };
  }

  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) return { ok: false, error: await translateMessage("Could not delete that document.") };

  await supabase.storage.from("travel-documents").remove([document.file_path]);

  if (document.trip_id) revalidateTrip(document.trip_id);
  else revalidatePath("/vault");

  return { ok: true };
}
