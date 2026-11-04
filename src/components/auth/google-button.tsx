"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signInWithGoogleAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

/**
 * Starts the official Supabase Google OAuth flow.
 *
 * The Client ID and Client Secret live in Supabase → Authentication →
 * Providers → Google, never in this project. Nothing secret reaches the
 * browser: the button only calls a server action.
 *
 * Deliberately not wrapped in its own <form>: every auth screen already wraps
 * its fields in a <form>, and a nested form is invalid HTML that makes the
 * browser submit the credentials form natively instead of running OAuth.
 */
export function GoogleButton({
  next,
  label,
  disabled = false,
}: {
  next: string;
  label?: string;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await signInWithGoogleAction(next);
      if (result.status === "redirect") {
        window.location.assign(result.url);
        return;
      }
      router.push(`/login?error=${result.reason}`);
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      disabled={disabled}
      loading={pending}
      onClick={handleClick}
      className="w-full"
    >
      {!pending ? (
        <svg viewBox="0 0 24 24" aria-hidden className="size-[18px]">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44a5.51 5.51 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.17 3.58-8.86Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A11.99 11.99 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.29a7.19 7.19 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
          />
        </svg>
      ) : null}
      {label ?? t.auth.continueWithGoogle}
    </Button>
  );
}
