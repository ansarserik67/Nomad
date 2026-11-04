"use client";

import {
  ArrowUp,
  Bot,
  Eraser,
  Route,
  Sparkles,
  TriangleAlert,
  UserRound,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAssistant, type ChatQuota } from "@/components/ai/use-assistant";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/field";
import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { format } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";
import { cn, formatDateRange } from "@/lib/utils";

type TripContext = {
  id: string;
  title: string;
  city: string;
  country: string;
  startDate: string | null;
  endDate: string | null;
  currency: string;
};

type Mode = "assistant" | "itinerary" | "budget_analysis" | "recommendations";

const MODES: { key: Mode; icon: typeof Sparkles }[] = [
  { key: "assistant", icon: Sparkles },
  { key: "itinerary", icon: Route },
  { key: "budget_analysis", icon: Wallet },
  { key: "recommendations", icon: Sparkles },
];

export function AssistantWorkspace({
  trips,
  initialTripId,
  initialQuota,
}: {
  trips: TripContext[];
  initialTripId?: string;
  initialQuota: ChatQuota | null;
}) {
  const { t, locale } = useI18n();
  const { messages, pending, error, quota, send, clear } = useAssistant(initialQuota);
  const [mode, setMode] = useState<Mode>("assistant");
  const [tripId, setTripId] = useState(initialTripId ?? "");
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const remaining = quota?.remaining ?? null;
  const exhausted = remaining !== null && remaining <= 0;
  const selectedTrip = trips.find((trip) => trip.id === tripId) ?? null;

  const modeLabel: Record<Mode, string> = {
    assistant: t.ai.modeAsk,
    itinerary: t.ai.modeItinerary,
    budget_analysis: t.ai.modeBudget,
    recommendations: t.ai.modeDestinations,
  };

  const modePrompt: Record<Mode, string> = {
    assistant: t.ai.promptAsk,
    itinerary: t.ai.promptItinerary,
    budget_analysis: t.ai.promptBudget,
    recommendations: t.ai.promptDestinations,
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending]);

  async function submit(text?: string) {
    const content = (text ?? value).trim();
    if (!content || pending || exhausted) return;
    setValue("");
    await send(content, {
      mode,
      tripId: tripId || null,
      locale,
      errors: { generic: t.ai.errorGeneric, network: t.ai.errorNetwork },
    });
    document.getElementById("assistant-input")?.focus();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
      <GlassCard className="flex min-h-[640px] flex-col overflow-hidden" padded={false}>
        <div className="border-b border-line px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="label-eyebrow">{t.ai.eyebrow}</p>
              <h2 className="mt-1.5 font-display text-[17px] font-semibold">
                {selectedTrip
                  ? format(t.ai.planningTitle, { city: selectedTrip.city })
                  : t.ai.defaultTitle}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-medium",
                  exhausted
                    ? "border-warning/30 bg-warning/10 text-warning"
                    : "border-teal/25 bg-teal/10 text-teal",
                )}
              >
                {quota
                  ? format(t.ai.quotaLeft, { remaining: remaining ?? 0, limit: quota.limit })
                  : t.ai.quotaFallback}
              </span>
              {messages.length > 0 ? (
                <button
                  type="button"
                  onClick={clear}
                  className="rounded-lg p-1.5 text-muted-2 transition-colors hover:bg-surface-2 hover:text-paper"
                  aria-label={t.ai.clear}
                >
                  <Eraser className="size-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex gap-1 overflow-x-auto no-scrollbar">
            {MODES.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10.5px] font-medium transition-colors",
                    mode === item.key
                      ? "border-accent/30 bg-accent/10 text-accent-soft"
                      : "border-line bg-surface-1 text-muted hover:text-paper",
                  )}
                >
                  <Icon className="size-3" /> {modeLabel[item.key]}
                </button>
              );
            })}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-lg pt-4 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-[16px] border border-accent/20 bg-accent/10 text-accent">
                <Bot className="size-5" strokeWidth={1.6} />
              </span>
              <h3 className="mt-4 font-display text-[19px] font-semibold tracking-[-0.02em]">
                {t.ai.emptyTitle}
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{t.ai.emptyBody}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                {MODES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => void submit(modePrompt[item.key])}
                    disabled={pending || exhausted}
                    className="rounded-full border border-line bg-surface-1 px-3 py-1.5 text-left text-[10.5px] text-muted transition-colors hover:border-accent/30 hover:text-paper disabled:opacity-50"
                  >
                    {modePrompt[item.key]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2.5",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.role === "assistant" ? (
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-accent">
                      <Bot className="size-3.5" />
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[86%] rounded-[16px] px-3.5 py-2.5 text-[12.5px] leading-relaxed",
                      message.role === "user"
                        ? "border border-accent/20 bg-accent/[0.09] text-paper"
                        : "border border-line bg-surface-1 text-muted",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" ? (
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-muted">
                      <UserRound className="size-3.5" />
                    </span>
                  ) : null}
                </div>
              ))}
              {pending ? (
                <div className="flex items-center gap-2 pl-9 text-[11px] text-muted-2">
                  <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                  {t.ai.thinking}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t border-line p-3 sm:p-4">
          {error ? (
            <p
              role="alert"
              className="mb-2 rounded-[12px] border border-danger/25 bg-danger/[0.07] px-3 py-2 text-[11px] leading-relaxed text-danger"
            >
              {error}
            </p>
          ) : null}
          {exhausted ? (
            <p className="mb-2 rounded-[12px] border border-warning/25 bg-warning/[0.07] px-3 py-2 text-[11px] leading-relaxed text-warning">
              {t.ai.exhaustedNotice}
            </p>
          ) : null}

          <div className="flex items-end gap-2">
            <div className="glass-field min-h-11 flex-1 px-3 py-2">
              <label htmlFor="assistant-input" className="sr-only">
                {t.ai.inputLabel}
              </label>
              <Textarea
                id="assistant-input"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submit();
                  }
                }}
                placeholder={exhausted ? t.ai.placeholderExhausted : t.ai.placeholder}
                disabled={pending || exhausted}
                className="min-h-0 resize-none border-0 bg-transparent p-0 text-[12.5px] shadow-none focus:shadow-none"
                rows={2}
              />
            </div>
            <Button
              onClick={() => void submit()}
              disabled={pending || exhausted || !value.trim()}
              size="icon"
              aria-label={t.ai.send}
              className="mb-0.5"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[9.5px] text-muted-2">{t.ai.hint}</p>
            <p className="text-[9.5px] text-muted-2">{t.ai.disclaimer}</p>
          </div>
        </div>
      </GlassCard>

      <div className="space-y-4">
        <GlassCard>
          <CardHeader
            eyebrow={t.ai.contextEyebrow}
            title={t.ai.contextTitle}
            description={t.ai.contextBody}
          />
          <div className="mt-4">
            <label htmlFor="assistant-trip" className="sr-only">
              {t.ai.tripLabel}
            </label>
            <Select
              id="assistant-trip"
              value={tripId}
              onChange={(event) => setTripId(event.target.value)}
            >
              <option value="">{t.ai.noTrip}</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.city} · {trip.title}
                </option>
              ))}
            </Select>
          </div>
          {selectedTrip ? (
            <div className="mt-3 rounded-[14px] border border-line bg-surface-1 px-3.5 py-3">
              <p className="text-[12px] font-medium text-paper">
                {selectedTrip.city}, {selectedTrip.country}
              </p>
              <p className="mt-0.5 text-[10.5px] text-muted-2">
                {formatDateRange(selectedTrip.startDate, selectedTrip.endDate, locale)} ·{" "}
                {selectedTrip.currency}
              </p>
            </div>
          ) : null}
        </GlassCard>

        <GlassCard>
          <CardHeader eyebrow={t.ai.allowanceEyebrow} title={t.ai.allowanceTitle} />
          <div className="mt-4">
            <div className="flex items-end justify-between">
              <p className="font-display text-[28px] font-semibold leading-none">
                {remaining ?? "—"}
              </p>
              <p className="text-[10.5px] text-muted-2">
                {quota ? format(t.ai.used, { used: quota.used, limit: quota.limit }) : t.ai.limitUnavailable}
              </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#8b9dff,#65d6ce)]"
                style={{
                  width: `${quota ? Math.min(100, (quota.used / quota.limit) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-muted-2">{t.ai.allowanceBody}</p>
          </div>
        </GlassCard>

        <GlassCard tone="subtle">
          <p className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-2">
            <TriangleAlert className="size-3.5" /> {t.ai.limitsTitle}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">{t.ai.limitsBody}</p>
        </GlassCard>
      </div>
    </div>
  );
}
