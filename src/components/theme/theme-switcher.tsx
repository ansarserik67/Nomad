"use client";

import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/lib/i18n/provider";
import { THEMES, type Theme } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import { cn } from "@/lib/utils";

const ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const satisfies Record<Theme, typeof Sun>;

export function ThemeSwitcher() {
  const { theme, resolved, setTheme } = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const CurrentIcon = ICONS[theme] ?? ICONS.system;
  const labels: Record<Theme, string> = {
    light: t.theme.light,
    dark: t.theme.dark,
    system: t.theme.system,
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`${t.theme.label}: ${labels[theme]}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 items-center gap-1 rounded-xl px-2 text-muted transition-colors hover:bg-surface-2 hover:text-paper"
      >
        <CurrentIcon className="size-[18px]" strokeWidth={1.7} />
        <ChevronDown className="hidden size-3 text-muted-2 sm:inline" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t.theme.title}
          className="glass absolute right-0 top-[calc(100%+8px)] z-50 w-[210px] overflow-hidden p-1.5"
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted-2">
            {t.theme.title}
          </p>
          {THEMES.map((option) => {
            const Icon = ICONS[option];
            const active = theme === option;
            return (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setTheme(option);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[11px] px-2.5 py-2 text-left text-[12.5px] transition-colors",
                  active
                    ? "bg-surface-2 text-paper"
                    : "text-muted hover:bg-surface-1 hover:text-paper",
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.7} />
                <span className="flex-1">{labels[option]}</span>
                {active ? <Check className="size-3.5 text-accent" /> : null}
              </button>
            );
          })}
          <p className="px-2.5 pb-1 pt-2 text-[10px] leading-relaxed text-muted-2">
            {t.theme.description}
          </p>
          <p className="px-2.5 pb-1.5 text-[10px] text-muted-2/80">
            {t.theme.label}: {labels[theme]} · {resolved === "light" ? t.theme.light : t.theme.dark}
          </p>
        </div>
      ) : null}
    </div>
  );
}
