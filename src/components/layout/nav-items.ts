import {
  BedDouble,
  CalendarRange,
  Compass,
  FolderLock,
  LayoutDashboard,
  Map,
  MapPinned,
  Settings,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Every navigation label comes from `t.nav`. */
export type NavKey = keyof Dictionary["nav"];

export type NavItem = {
  href: string;
  key: NavKey;
  shortKey?: NavKey;
  icon: LucideIcon;
};

export type NavGroup = {
  labelKey: NavKey;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "plan",
    items: [
      { href: "/dashboard", key: "overview", icon: LayoutDashboard },
      { href: "/discover", key: "discover", icon: Compass },
      { href: "/trips", key: "trips", icon: Map },
      { href: "/planner", key: "planner", icon: CalendarRange },
      { href: "/hotels", key: "hotels", icon: BedDouble },
      { href: "/places", key: "places", icon: MapPinned },
    ],
  },
  {
    labelKey: "onTheRoad",
    items: [
      { href: "/wallet", key: "wallet", icon: Wallet },
      { href: "/group", key: "group", icon: Users },
      { href: "/vault", key: "vault", icon: FolderLock },
    ],
  },
  {
    labelKey: "intelligence",
    items: [{ href: "/assistant", key: "assistant", icon: Sparkles }],
  },
];

export const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  key: "settings",
  icon: Settings,
};

export const MOBILE_ITEMS: NavItem[] = [
  { href: "/dashboard", key: "overview", shortKey: "home", icon: LayoutDashboard },
  { href: "/discover", key: "discover", shortKey: "discover", icon: Compass },
  { href: "/trips", key: "trips", shortKey: "trips", icon: Map },
  { href: "/wallet", key: "wallet", shortKey: "wallet", icon: Wallet },
  { href: "/assistant", key: "assistant", shortKey: "assistant", icon: Sparkles },
];

export function isActiveHref(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
