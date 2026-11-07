import Link from "next/link";
import { ArrowUpRight, Globe2, LockKeyhole, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/locale/locale-switcher";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Badge } from "@/components/ui/badge";
import { getServerDictionary } from "@/lib/i18n/server";

export { AuthNotice } from "@/components/auth/auth-notice";

export async function AuthShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = await getServerDictionary();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo href="/" />
        <div className="flex items-center gap-3">
          <span className="hidden text-[12px] text-muted-2 sm:inline">
            {t.pages.dashboard.title}
          </span>
          <Link
            href="/setup"
            className="text-[12px] font-medium text-muted transition-colors hover:text-paper"
          >
            {t.settings.setup}
          </Link>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <ThemeSwitcher />
            <LocaleSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-10 px-5 pb-12 pt-2 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <section className="relative hidden lg:block" aria-hidden>
          <Badge tone="teal" dot className="mb-7">
            {t.nav.trips}
          </Badge>
          <h1 className="font-display text-[52px] font-semibold leading-[1.03] tracking-[-0.045em] text-paper">
            {t.pages.dashboard.title}
          </h1>
          <p className="mt-6 max-w-md text-[14.5px] leading-relaxed text-muted">
            {t.settings.description}
          </p>

          <div className="relative mt-12 max-w-md">
            <div className="glass overflow-hidden p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-2">
                  <Globe2 className="size-3.5" /> {t.common.destination}
                </div>
                <span className="rounded-full border border-teal/25 bg-teal/10 px-2.5 py-1 text-[10px] font-medium text-teal">
                  {t.common.today}
                </span>
              </div>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="font-display text-[28px] font-semibold tracking-[-0.03em]">
                    Kyoto
                  </p>
                  <p className="mt-1 text-[12px] text-muted">Japan · 9 days</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-2">
                    {t.common.total}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-teal">64%</p>
                </div>
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full w-[64%] rounded-full bg-[linear-gradient(90deg,#8b9dff,#65d6ce)]" />
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[11px] text-muted-2">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-accent" /> {t.nav.assistant}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <LockKeyhole className="size-3.5" /> {t.nav.vault}
                </span>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-10 -top-10 -z-10 size-44 rounded-full bg-[radial-gradient(circle,rgba(139,157,255,0.22),transparent_68%)] blur-2xl" />
          </div>

          <p className="mt-6 max-w-sm text-[11px] leading-relaxed text-muted-2">
            {t.auth.settingsHint}
          </p>
        </section>

        <section className="w-full">
          <div className="glass mx-auto w-full max-w-[440px] p-6 sm:p-8">{children}</div>
          {footer ? <div className="mx-auto mt-5 max-w-[440px]">{footer}</div> : null}
          <p className="mx-auto mt-6 flex max-w-[440px] items-center justify-center gap-1.5 text-[11px] text-muted-2">
            <ArrowUpRight className="size-3" />
            <Link href="/dashboard" className="transition-colors hover:text-muted">
              {t.nav.overview}
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
