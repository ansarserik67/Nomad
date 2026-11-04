"use client";

import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useActionState, useState } from "react";

import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
} from "@/app/(auth)/actions";
import { initialAuthState } from "@/lib/form-state";
import { AuthNotice } from "@/components/auth/auth-notice";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useI18n } from "@/lib/i18n/provider";

function PasswordInput({
  name,
  id,
  autoComplete,
  placeholder,
  invalid,
}: {
  name: string;
  id: string;
  autoComplete: string;
  placeholder: string;
  invalid?: boolean;
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="glass-field flex h-11 items-center gap-2.5 px-3.5"
      data-invalid={invalid || undefined}
    >
      <LockKeyhole className="size-4 shrink-0 text-muted-2" aria-hidden />
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className="h-full w-full min-w-0 bg-transparent text-sm text-paper outline-none placeholder:text-muted-2/80"
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="rounded-md p-1 text-muted-2 transition-colors hover:text-paper"
        aria-label={visible ? t.auth.hidePassword : t.auth.showPassword}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function AuthDivider() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="h-px flex-1 bg-line" />
      <span className="text-[10.5px] uppercase tracking-[0.18em] text-muted-2">
        {t.common.or}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function ConfiguredWarning({ configured }: { configured: boolean }) {
  const { t } = useI18n();
  if (configured) return null;
  return <AuthNotice status="error" message={t.auth.notConfigured} />;
}

export function LoginForm({
  next,
  configured,
  notice,
}: {
  next?: string;
  configured: boolean;
  notice?: string;
}) {
  const { t, translate } = useI18n();
  const [state, action, pending] = useActionState(signInAction, initialAuthState);

  return (
    <form action={action} className="space-y-5">
      <div>
        <p className="label-eyebrow mb-2.5">{t.auth.welcomeBack}</p>
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em]">
          {t.auth.signInTitle}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">{t.auth.signInSubtitle}</p>
      </div>

      <ConfiguredWarning configured={configured} />
      {notice && state.status === "idle" ? (
        <AuthNotice status="error" message={translate(notice) ?? notice} />
      ) : null}
      {state.message ? (
        <AuthNotice
          status={state.status === "error" ? "error" : "notice"}
          message={state.message}
        />
      ) : null}

      <input type="hidden" name="next" value={next ?? ""} />

      <GoogleButton next={next || "/dashboard"} disabled={!configured} />
      <AuthDivider />

      <Field
        label={t.auth.email}
        htmlFor="email"
        error={translate(state.fieldErrors?.email)}
      >
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t.auth.emailPlaceholder}
          leadingIcon={<Mail className="size-4" />}
          required
          disabled={!configured}
        />
      </Field>

      <Field
        label={t.auth.password}
        htmlFor="password"
        error={translate(state.fieldErrors?.password)}
        hint={
          <span className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-muted transition-colors hover:text-paper"
            >
              {t.auth.forgotPassword}
            </Link>
          </span>
        }
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder={t.auth.passwordPlaceholder}
        />
      </Field>

      <Button type="submit" className="w-full" loading={pending} disabled={!configured}>
        {t.auth.signIn}
      </Button>

      <p className="text-center text-[12.5px] text-muted">
        {t.auth.noAccount}{" "}
        <Link
          href="/signup"
          className="font-medium text-accent transition-colors hover:text-accent-soft"
        >
          {t.auth.createAccount}
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ next, configured }: { next?: string; configured: boolean }) {
  const { t, translate } = useI18n();
  const [state, action, pending] = useActionState(signUpAction, initialAuthState);

  return (
    <form action={action} className="space-y-5">
      <div>
        <p className="label-eyebrow mb-2.5">{t.auth.startExploring}</p>
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em]">
          {t.auth.createSpace}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">{t.auth.createSpaceSubtitle}</p>
      </div>

      <ConfiguredWarning configured={configured} />
      {state.status !== "idle" && state.message ? (
        <AuthNotice
          status={state.status === "error" ? "error" : "notice"}
          message={state.message}
        />
      ) : null}

      <input type="hidden" name="next" value={next ?? ""} />

      <GoogleButton
        next={next || "/dashboard"}
        label={t.auth.signUpWithGoogle}
        disabled={!configured}
      />
      <AuthDivider />

      <Field
        label={t.auth.fullName}
        htmlFor="fullName"
        error={translate(state.fieldErrors?.fullName)}
      >
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder={t.auth.namePlaceholder}
          leadingIcon={<UserRound className="size-4" />}
          required
          disabled={!configured}
        />
      </Field>

      <Field label={t.auth.email} htmlFor="email" error={translate(state.fieldErrors?.email)}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t.auth.emailPlaceholder}
          leadingIcon={<Mail className="size-4" />}
          required
          disabled={!configured}
        />
      </Field>

      <Field
        label={t.auth.password}
        htmlFor="password"
        error={translate(state.fieldErrors?.password)}
        hint={t.auth.passwordHint}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder={t.auth.createPassword}
        />
      </Field>

      <Button type="submit" className="w-full" loading={pending} disabled={!configured}>
        {t.auth.createAccount}
      </Button>

      <p className="text-center text-[12.5px] text-muted">
        {t.auth.haveAccount}{" "}
        <Link
          href="/login"
          className="font-medium text-accent transition-colors hover:text-accent-soft"
        >
          {t.auth.signIn}
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm({ configured }: { configured: boolean }) {
  const { t, translate } = useI18n();
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initialAuthState,
  );

  return (
    <form action={action} className="space-y-5">
      <div>
        <p className="label-eyebrow mb-2.5">{t.auth.accountRecovery}</p>
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em]">
          {t.auth.resetPasswordTitle}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">{t.auth.resetPasswordSubtitle}</p>
      </div>

      <ConfiguredWarning configured={configured} />
      {state.status !== "idle" && state.message ? (
        <AuthNotice
          status={state.status === "error" ? "error" : "notice"}
          message={state.message}
        />
      ) : null}

      <Field label={t.auth.email} htmlFor="email" error={translate(state.fieldErrors?.email)}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t.auth.emailPlaceholder}
          leadingIcon={<Mail className="size-4" />}
          required
          disabled={!configured}
        />
      </Field>

      <Button type="submit" className="w-full" loading={pending} disabled={!configured}>
        {t.auth.sendResetLink}
      </Button>

      <p className="text-center text-[12.5px] text-muted">
        <Link href="/login" className="transition-colors hover:text-paper">
          {t.auth.backToSignIn}
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ configured }: { configured: boolean }) {
  const { t, translate } = useI18n();
  const [state, action, pending] = useActionState(updatePasswordAction, initialAuthState);

  return (
    <form action={action} className="space-y-5">
      <div>
        <p className="label-eyebrow mb-2.5">{t.auth.almostThere}</p>
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.03em]">
          {t.auth.chooseNewPassword}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">{t.auth.resetLinkSessionOnly}</p>
      </div>

      <ConfiguredWarning configured={configured} />
      {state.status !== "idle" && state.message ? (
        <AuthNotice
          status={state.status === "error" ? "error" : "notice"}
          message={state.message}
        />
      ) : null}

      <Field
        label={t.auth.newPassword}
        htmlFor="password"
        error={translate(state.fieldErrors?.password)}
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder={t.auth.newPassword}
        />
      </Field>

      <Field
        label={t.auth.confirmPassword}
        htmlFor="confirmPassword"
        error={translate(state.fieldErrors?.confirmPassword)}
      >
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder={t.auth.repeatPassword}
        />
      </Field>

      <Button type="submit" className="w-full" loading={pending} disabled={!configured}>
        {t.auth.updatePassword}
      </Button>

      <p className="text-center text-[12.5px] text-muted">
        <Link href="/forgot-password" className="transition-colors hover:text-paper">
          {t.auth.requestNewLink}
        </Link>
      </p>
    </form>
  );
}
