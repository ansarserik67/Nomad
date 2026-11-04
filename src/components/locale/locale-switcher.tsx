"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LOCALES, LOCALE_META } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`${t.locale.label}: ${LOCALE_META[locale].label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 items-center gap-1 rounded-xl px-2 text-muted transition-colors hover:bg-surface-2 hover:text-paper"
      >
        <Languages className="size-[18px]" strokeWidth={1.7} />
        <span className="text-[11px] font-medium uppercase tracking-[0.06em]">
          {locale}
        </span>
        <ChevronDown className="hidden size-3 text-muted-2 sm:inline" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t.locale.title}
          className="glass absolute right-0 top-[calc(100%+8px)] z-50 w-[220px] overflow-hidden p-1.5"
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted-2">
            {t.locale.title}
          </p>
          {LOCALES.map((option) => {
            const active = locale === option;
            return (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setLocale(option);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[11px] px-2.5 py-2 text-left text-[12.5px] transition-colors",
                  active
                    ? "bg-surface-2 text-paper"
                    : "text-muted hover:bg-surface-1 hover:text-paper",
                )}
              >
                <span className="w-6 shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-2">
                  {option}
                </span>
                <span className="flex-1">{LOCALE_META[option].label}</span>
                {active ? <Check className="size-3.5 text-accent" /> : null}
              </button>
            );
          })}
          <p className="px-2.5 pb-1.5 pt-2 text-[10px] leading-relaxed text-muted-2">
            {t.locale.description}
          </p>
        </div>
      ) : null}
    </div>
  );
}
