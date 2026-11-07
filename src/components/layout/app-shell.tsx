"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Plane,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { LocaleSwitcher } from "@/components/locale/locale-switcher";
import {
  MOBILE_ITEMS,
  NAV_GROUPS,
  isActiveHref,
  type NavItem,
} from "@/components/layout/nav-items";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/primitives";
import { format } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type ShellViewer = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  homeCity: string | null;
} | null;

type Quota = { used: number; limit: number; remaining: number } | null;

type TravelStatus = {
  state: "home" | "upcoming" | "travelling";
  label: string;
  city: string;
  country: string;
  days: number | null;
} | null;

type ShellNotification = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "accent" | "teal" | "warning" | "danger";
};

function NavRow({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const active = isActiveHref(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-[13px] px-3 py-2.5 text-[13px] font-medium transition-colors duration-200",
        active
          ? "bg-[linear-gradient(90deg,rgba(139,157,255,0.16),rgba(139,157,255,0.03))] text-paper"
          : "text-muted hover:bg-surface-2 hover:text-paper",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-accent transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      <Icon
        className={cn(
          "size-[17px] shrink-0 transition-colors",
          active ? "text-accent" : "text-muted-2 group-hover:text-muted",
        )}
        strokeWidth={1.7}
      />
      <span className="truncate">{t.nav[item.key]}</span>
    </Link>
  );
}

function SidebarContent({
  viewer,
  quota,
  configured,
  onNavigate,
}: {
  viewer: ShellViewer;
  quota: Quota;
  configured: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-6 pt-2">
        <Logo />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto no-scrollbar" aria-label={t.nav.mainNavigation}>
        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey}>
            <p className="mb-2 px-3 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted-2/80">
              {t.nav[group.labelKey]}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavRow key={item.href} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-3 pt-4">
        <div className="rounded-[16px] border border-line bg-surface-1 p-3.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-paper">
              <Sparkles className="size-3.5 text-accent" /> {t.shell.aiOperations}
            </span>
            <Badge tone={quota && quota.remaining === 0 ? "warning" : "neutral"}>
              {quota ? `${quota.remaining}/${quota.limit}` : "—"}
            </Badge>
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-2">
            {!configured
              ? t.shell.connectSupabase
              : quota
                ? format(t.shell.quotaUsed, { used: quota.used, limit: quota.limit })
                : t.shell.quotaUnavailable}
          </p>
          <Link
            href="/assistant"
            onClick={onNavigate}
            className="mt-2.5 inline-flex text-[11px] font-medium text-accent transition-colors hover:text-accent-soft"
          >
            {t.shell.openAssistant} →
          </Link>
        </div>

        <div className="flex items-center gap-2.5 rounded-[16px] px-2 py-1.5">
          <Avatar name={viewer?.displayName} email={viewer?.email} src={viewer?.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-paper">
              {viewer?.displayName ?? t.shell.guestPreview}
            </p>
            <p className="truncate text-[10.5px] text-muted-2">
              {viewer?.homeCity ?? viewer?.email ?? t.shell.notSignedIn}
            </p>
          </div>
          <Link
            href="/settings"
            onClick={onNavigate}
            className="rounded-lg p-1.5 text-muted-2 transition-colors hover:bg-surface-2 hover:text-paper"
            aria-label={t.nav.settings}
          >
            <SettingsIcon className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  viewer,
  quota,
  travelStatus,
  notifications,
  configured,
  children,
}: {
  viewer: ShellViewer;
  quota: Quota;
  travelStatus: TravelStatus;
  notifications: ShellNotification[];
  configured: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menu, setMenu] = useState<"notifications" | "profile" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenu(null);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenu(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenu(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-[266px] shrink-0 p-3 pr-0 lg:block">
        <div className="glass h-full rounded-[24px] p-3">
          <SidebarContent viewer={viewer} quota={quota} configured={configured} />
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="absolute inset-y-0 left-0 w-[86%] max-w-[320px] border-r border-line bg-panel p-4"
              role="dialog"
              aria-modal="true"
              aria-label={t.nav.mainNavigation}
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-paper"
                aria-label={t.nav.closeNavigation}
              >
                <X className="size-4" />
              </button>
              <SidebarContent
                viewer={viewer}
                quota={quota}
                configured={configured}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-ink/70 backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-muted transition-colors hover:text-paper lg:hidden"
              aria-label={t.nav.openNavigation}
            >
              <Menu className="size-4" />
            </button>

            <div className="lg:hidden">
              <Logo compact />
            </div>

            <form
              action="/discover"
              method="get"
              className="ml-1 hidden min-w-0 flex-1 sm:block lg:ml-2"
              role="search"
            >
              <label htmlFor="global-search" className="sr-only">
                {t.nav.searchDestinations}
              </label>
              <div className="glass-field flex h-9 max-w-[360px] items-center gap-2 px-3">
                <Search className="size-3.5 shrink-0 text-muted-2" aria-hidden />
                <input
                  id="global-search"
                  name="q"
                  type="search"
                  placeholder={t.shell.searchPlaceholder}
                  className="h-full w-full min-w-0 bg-transparent text-[12.5px] text-paper outline-none placeholder:text-muted-2/80"
                />
                <kbd className="hidden rounded border border-line px-1 text-[9px] text-muted-2 md:inline">
                  /
                </kbd>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {travelStatus ? (
                <Link
                  href={travelStatus.state === "travelling" ? "/trips" : "/planner"}
                  className="mr-1 hidden items-center gap-2 rounded-full border border-line bg-surface-1 py-1.5 pl-2.5 pr-3 text-[11px] transition-colors hover:border-line-strong xl:inline-flex"
                >
                  <span className="relative grid size-5 place-items-center rounded-full bg-accent/12 text-accent">
                    <Plane className="size-3" />
                    {travelStatus.state !== "home" ? (
                      <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-teal" />
                    ) : null}
                  </span>
                  <span className="text-muted">
                    {travelStatus.state === "home" ? (
                      t.shell.statusHome
                    ) : (
                      <>
                        <span className="text-paper">{travelStatus.city}</span>
                        {travelStatus.days !== null && travelStatus.days >= 0
                          ? ` · ${format(t.shell.inDays, { days: travelStatus.days })}`
                          : travelStatus.state === "travelling"
                            ? ` · ${t.shell.now}`
                            : ""}
                      </>
                    )}
                  </span>
                </Link>
              ) : null}

              <div className="relative flex items-center gap-0.5 sm:gap-1" ref={menuRef}>
                <ThemeSwitcher />
                <LocaleSwitcher />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setMenu((value) => (value === "notifications" ? null : "notifications"))
                    }
                    className="relative grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-paper"
                    aria-label={`${t.nav.notifications} (${notifications.length})`}
                    aria-expanded={menu === "notifications"}
                  >
                    <Bell className="size-[18px]" strokeWidth={1.7} />
                    {notifications.length > 0 ? (
                      <span className="absolute right-1.5 top-1.5 grid min-w-[14px] place-items-center rounded-full bg-accent px-1 text-[8px] font-semibold leading-[14px] text-on-accent">
                        {notifications.length}
                      </span>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMenu((value) => (value === "profile" ? null : "profile"))}
                    className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-2"
                    aria-label={t.nav.accountMenu}
                    aria-expanded={menu === "profile"}
                  >
                    <Avatar
                      name={viewer?.displayName}
                      email={viewer?.email}
                      src={viewer?.avatarUrl}
                      size="sm"
                    />
                    <span className="hidden max-w-[110px] truncate text-[12px] font-medium text-paper md:inline">
                      {viewer?.displayName ?? t.shell.guestPreview}
                    </span>
                    <ChevronDown className="hidden size-3 text-muted-2 md:inline" />
                  </button>
                </div>

                <AnimatePresence>
                  {menu === "notifications" ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.99 }}
                      transition={{ duration: 0.16 }}
                      className="glass absolute right-0 top-[calc(100%+8px)] w-[min(92vw,340px)] overflow-hidden p-2"
                    >
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-2">
                          {t.nav.notifications}
                        </p>
                        <span className="text-[10px] text-muted-2">{notifications.length}</span>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="px-3 py-7 text-center">
                          <p className="text-[12.5px] font-medium text-paper">{t.shell.allCaughtUp}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-2">
                            {t.shell.notificationsEmpty}
                          </p>
                        </div>
                      ) : (
                        <ul className="max-h-[340px] overflow-y-auto">
                          {notifications.map((notification) => (
                            <li key={notification.id}>
                              <Link
                                href={notification.href}
                                onClick={() => setMenu(null)}
                                className="flex gap-2.5 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-surface-2"
                              >
                                <span
                                  className={cn(
                                    "mt-1 size-1.5 shrink-0 rounded-full",
                                    notification.tone === "danger"
                                      ? "bg-danger"
                                      : notification.tone === "warning"
                                        ? "bg-warning"
                                        : notification.tone === "teal"
                                          ? "bg-teal"
                                          : "bg-accent",
                                  )}
                                />
                                <span className="min-w-0">
                                  <span className="block text-[12.5px] font-medium leading-snug text-paper">
                                    {notification.title}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-2">
                                    {notification.detail}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <AnimatePresence>
                  {menu === "profile" ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.99 }}
                      transition={{ duration: 0.16 }}
                      className="glass absolute right-0 top-[calc(100%+8px)] w-[min(92vw,280px)] overflow-hidden p-2"
                    >
                      <div className="flex items-center gap-2.5 px-2 py-2">
                        <Avatar
                          name={viewer?.displayName}
                          email={viewer?.email}
                          src={viewer?.avatarUrl}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-paper">
                            {viewer?.displayName ?? t.shell.guestPreview}
                          </p>
                          <p className="truncate text-[11px] text-muted-2">
                            {viewer?.email ?? t.shell.noActiveSession}
                          </p>
                        </div>
                      </div>
                      <div className="hairline my-1.5" />
                      <Link
                        href="/settings"
                        onClick={() => setMenu(null)}
                        className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] text-muted transition-colors hover:bg-surface-2 hover:text-paper"
                      >
                        <SettingsIcon className="size-4" /> {t.nav.settings}
                      </Link>
                      {!configured ? (
                        <Link
                          href="/setup"
                          onClick={() => setMenu(null)}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] text-warning transition-colors hover:bg-surface-2"
                        >
                          <TriangleAlert className="size-4" /> {t.shell.finishSetup}
                        </Link>
                      ) : null}
                      {viewer ? (
                        <form action="/auth/signout" method="post">
                          <button
                            type="submit"
                            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[12.5px] text-muted transition-colors hover:bg-surface-2 hover:text-paper"
                          >
                            <LogOut className="size-4" /> {t.nav.signOut}
                          </button>
                        </form>
                      ) : (
                        <Link
                          href="/login"
                          onClick={() => setMenu(null)}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] text-accent transition-colors hover:bg-surface-2"
                        >
                          <LogOut className="size-4" /> {t.nav.signIn}
                        </Link>
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {!configured ? (
          <div className="border-b border-warning/15 bg-warning/[0.055]">
            <div className="mx-auto flex w-full max-w-[1440px] items-center gap-2.5 px-4 py-2.5 text-[11.5px] text-warning sm:px-6 lg:px-8">
              <TriangleAlert className="size-3.5 shrink-0" />
              <p className="min-w-0">
                <span className="font-medium">{t.shell.backendNotConnected}</span>{" "}
                <span className="text-warning/80">{t.shell.liveDisabled}</span>
              </p>
              <Link
                href="/setup"
                className="ml-auto shrink-0 rounded-full border border-warning/25 px-2.5 py-1 text-[10.5px] font-medium transition-colors hover:bg-warning/10"
              >
                {t.shell.setup}
              </Link>
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16">
          {children}
        </main>

        <nav
          className="fixed inset-x-3 bottom-3 z-40 lg:hidden"
          aria-label={t.nav.quickNavigation}
        >
          <div className="glass mx-auto flex max-w-md items-center justify-between gap-0.5 p-1.5">
            {MOBILE_ITEMS.map((item) => {
              const active = isActiveHref(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[14px] px-1 py-2 text-[9.5px] font-medium transition-colors",
                    active ? "bg-surface-2 text-paper" : "text-muted-2 hover:text-muted",
                  )}
                >
                  <Icon className={cn("size-[17px]", active && "text-accent")} strokeWidth={1.7} />
                  <span className="truncate">
                    {t.nav[item.shortKey ?? item.key]}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
