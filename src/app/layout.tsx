import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";

import { I18nProvider } from "@/lib/i18n/provider";
import { LOCALE_META } from "@/lib/i18n/config";
import { initLocale } from "@/lib/i18n/server";
import { initThemePreference } from "@/lib/theme.server";
import { ThemeProvider } from "@/lib/theme-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NOMAD — Your entire journey. One intelligent space.",
    template: "%s · NOMAD",
  },
  description:
    "NOMAD is an intelligent travel space for planning trips, tracking budgets and currencies, travelling with groups, and keeping every document in one private place.",
  applicationName: "NOMAD",
  keywords: ["travel", "trip planner", "travel budget", "itinerary", "travel documents"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f8" },
    { media: "(prefers-color-scheme: dark)", color: "#080D18" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

/**
 * Runs before the body paints. The server can read the stored preference but
 * not `prefers-color-scheme`, so "system" is resolved here — this is the only
 * way to avoid a flash of the wrong theme on a hard reload.
 */
const themeScript = `
(function () {
  try {
    var theme = document.cookie.match(/(?:^|;\\s*)nomad_theme=([^;]+)/);
    var preference = theme ? decodeURIComponent(theme[1]) : 'system';
    var resolved = preference;
    if (preference === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    var root = document.documentElement;
    root.setAttribute('data-theme', resolved === 'light' ? 'light' : 'dark');
    root.style.colorScheme = resolved === 'light' ? 'light' : 'dark';
  } catch (error) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, theme] = await Promise.all([
    initLocale(),
    initThemePreference(),
  ]);

  return (
    <html
      lang={LOCALE_META[locale].htmlLang}
      data-theme={theme === "light" ? "light" : "dark"}
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="relative font-sans antialiased">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-[18%] -top-[22%] size-[62vw] rounded-full bg-[radial-gradient(circle,rgba(139,157,255,0.13),transparent_66%)] blur-2xl" />
          <div className="absolute -right-[12%] top-[6%] size-[46vw] rounded-full bg-[radial-gradient(circle,rgba(101,214,206,0.09),transparent_68%)] blur-2xl" />
          <div className="absolute bottom-[-24%] left-[24%] size-[52vw] rounded-full bg-[radial-gradient(circle,rgba(112,84,214,0.11),transparent_70%)] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] bg-[size:88px_88px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
        </div>
        <ThemeProvider initialTheme={theme}>
          <I18nProvider initialLocale={locale}>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
