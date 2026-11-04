"use server";

import { redirect } from "next/navigation";

import type { AuthFormState } from "@/lib/form-state";
import { translateMessage, translateFieldErrors } from "@/lib/i18n/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/request";
import { safeNextPath } from "@/lib/utils";
import {
  authEmailSchema,
  authSignInSchema,
  authSignUpSchema,
  fieldErrors,
  passwordUpdateSchema,
} from "@/lib/validation";

/**
 * Supabase returns English SDK messages. They are mapped to fixed sentences
 * here and then translated into the language the requester is browsing in.
 */
async function authMessage(message: string): Promise<string> {
  const text = message.toLowerCase();
  let sentence = "We couldn't complete that request. Please try again.";
  if (text.includes("invalid login credentials")) {
    sentence = "Email or password is incorrect.";
  } else if (text.includes("email not confirmed")) {
    sentence = "Confirm your email address before signing in.";
  } else if (text.includes("user already registered")) {
    sentence = "That email is already registered. Sign in instead.";
  } else if (text.includes("rate limit") || text.includes("too many")) {
    sentence = "Too many attempts. Please wait a minute and try again.";
  } else if (text.includes("password should be")) {
    sentence = "Choose a stronger password (at least 8 characters).";
  }
  return translateMessage(sentence);
}

async function notConfiguredState(): Promise<AuthFormState> {
  return {
    status: "error",
    message: await translateMessage(
      "Supabase is not connected yet. Add your project keys to .env.local.",
    ),
  };
}

export async function signInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = authSignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: await translateFieldErrors(fieldErrors(parsed.error)) };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return notConfiguredState();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { status: "error", message: await authMessage(error.message) };

  redirect(safeNextPath(parsed.data.next));
}

export type GoogleSignInResult =
  | { status: "redirect"; url: string }
  | { status: "error"; reason: "config" | "oauth" };

/**
 * Returns the Supabase authorisation URL instead of redirecting.
 *
 * The auth screens already wrap their fields in a <form>, and a second form
 * around this button is invalid HTML that breaks hydration. The button calls
 * this action directly and navigates itself, so no nested form is needed.
 */
export async function signInWithGoogleAction(
  next: string,
): Promise<GoogleSignInResult> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { status: "error", reason: "config" };

  const origin = await getRequestOrigin();
  const safeNext = safeNextPath(next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`,
      queryParams: { access_type: "offline", prompt: "select_account" },
    },
  });

  if (error || !data?.url) return { status: "error", reason: "oauth" };

  return { status: "redirect", url: data.url };
}

export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = authSignUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: await translateFieldErrors(fieldErrors(parsed.error)) };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return notConfiguredState();

  const origin = await getRequestOrigin();
  const next = safeNextPath(parsed.data.next);

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return { status: "error", message: await authMessage(error.message) };

  if (data.session) redirect(next);

  return {
    status: "notice",
    message: await translateMessage(
      "Your account is ready. We sent a confirmation link to your inbox — open it to finish signing in.",
    ),
  };
}

export async function requestPasswordResetAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = authEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: await translateFieldErrors(fieldErrors(parsed.error)) };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return notConfiguredState();

  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  const neutralNotice = await translateMessage(
    "If an account exists for that address, a reset link is on its way.",
  );

  // Do not reveal whether an account exists for this address.
  if (error && error.status !== 429) {
    return { status: "notice", message: neutralNotice };
  }
  if (error) return { status: "error", message: await authMessage(error.message) };

  return { status: "notice", message: neutralNotice };
}

export async function updatePasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = passwordUpdateSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: await translateFieldErrors(fieldErrors(parsed.error)) };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return notConfiguredState();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: await translateMessage(
        "Your reset link has expired. Request a new one to continue.",
      ),
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: await authMessage(error.message) };

  redirect("/dashboard");
}
