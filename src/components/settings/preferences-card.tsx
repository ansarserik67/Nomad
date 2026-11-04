"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";

import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { LOCALES, LOCALE_META } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { THEMES, type Theme } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import { cn } from "@/lib/utils";

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const satisfies Record<Theme, typeof Sun>;

function OptionButton({
  active,
  onClick,
  children,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: typeof Sun;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-3 py-2 text-[12px] font-medium transition-colors",
        active
          ? "border-accent/40 bg-accent/12 text-paper"
          : "border-line bg-surface-1 text-muted hover:border-line-strong hover:text-paper",
      )}
    >
      {Icon ? <Icon className="size-3.5" strokeWidth={1.7} /> : null}
      <span className="truncate">{children}</span>
      {active ? <Check className="size-3 text-accent" /> : null}
    </button>
  );
}

export function PreferencesCard() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme, resolved } = useTheme();

  const themeLabels: Record<Theme, string> = {
    light: t.theme.light,
    dark: t.theme.dark,
    system: t.theme.system,
  };

  return (
    <GlassCard>
      <CardHeader
        eyebrow={t.settings.preferences}
        title={t.settings.preferencesDescription}
      />

      <div className="mt-5 space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium text-paper">{t.settings.theme}</p>
            <p className="text-[10.5px] text-muted-2">
              {themeLabels[theme]} · {resolved === "light" ? t.theme.light : t.theme.dark}
            </p>
          </div>
          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
            {THEMES.map((option) => (
              <OptionButton
                key={option}
                active={theme === option}
                onClick={() => setTheme(option)}
                icon={THEME_ICONS[option]}
              >
                {themeLabels[option]}
              </OptionButton>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] leading-relaxed text-muted-2">
            {t.theme.description}
          </p>
        </div>

        <div className="border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium text-paper">{t.settings.language}</p>
            <p className="text-[10.5px] text-muted-2">{LOCALE_META[locale].label}</p>
          </div>
          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
            {LOCALES.map((option) => (
              <OptionButton
                key={option}
                active={locale === option}
                onClick={() => setLocale(option)}
              >
                {LOCALE_META[option].label}
              </OptionButton>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] leading-relaxed text-muted-2">
            {t.locale.description}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
