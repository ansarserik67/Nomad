"use client";

import { ArrowUpRight, Send, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useAssistant, type ChatQuota } from "@/components/ai/use-assistant";
import { Badge } from "@/components/ui/badge";
import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { format } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export function AssistantWidget({
  available,
  unavailableReason,
  initialQuota,
}: {
  available: boolean;
  unavailableReason?: string;
  initialQuota: ChatQuota | null;
}) {
  const { t } = useI18n();
  const { messages, pending, error, quota, send } = useAssistant(initialQuota);
  const [value, setValue] = useState("");

  const PROMPTS = [t.dashboard.prompt1, t.dashboard.prompt2, t.dashboard.prompt3];

  const assistantMessages = messages.filter((message) => message.role === "assistant");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = value;
    setValue("");
    await send(input);
  }

  return (
    <GlassCard className="flex h-full flex-col overflow-hidden">
      <CardHeader
        eyebrow={t.dashboard.assistantEyebrow}
        title={t.dashboard.thinkItThrough}
        description={t.dashboard.askRoute}
        action={
          <Badge tone={quota && quota.remaining === 0 ? "warning" : "accent"}>
            {quota
              ? format(t.dashboard.leftBadge, { count: quota.remaining })
              : t.dashboard.perDayBadge}
          </Badge>
        }
      />

      {!available ? (
        <div className="mt-5 flex flex-1 flex-col justify-between gap-4">
          <div className="rounded-[16px] border border-warning/20 bg-warning/[0.06] p-3.5">
            <p className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-warning">
              <TriangleAlert className="size-3.5" /> {t.dashboard.assistantUnavailable}
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-warning/80">
              {unavailableReason ?? t.dashboard.connectServices}
            </p>
          </div>
          <Link
            href="/setup"
            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-accent transition-colors hover:text-accent-soft"
          >
            {t.dashboard.reviewSetup} <ArrowUpRight className="size-3" />
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-[16px] border border-accent/15 bg-accent/[0.055] p-3.5">
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent-soft">
                    <Sparkles className="size-3.5" /> {t.dashboard.contextAware}
                  </p>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
                    {t.dashboard.contextAwareDescription}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={pending}
                      onClick={() => void send(prompt)}
                      className="rounded-full border border-line bg-surface-1 px-3 py-1.5 text-left text-[10.5px] leading-snug text-muted transition-colors hover:border-line-strong hover:text-paper disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {messages.slice(-4).map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[92%] rounded-[14px] px-3 py-2.5 text-[11.5px] leading-relaxed",
                      message.role === "user"
                        ? "ml-auto border border-accent/20 bg-accent/[0.09] text-paper"
                        : "border border-line bg-surface-1 text-muted",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
                {pending ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1.5 text-[10.5px] text-muted-2">
                    <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                    {t.dashboard.thinking}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {error ? (
            <p role="alert" className="mt-2 rounded-lg border border-danger/20 bg-danger/[0.06] px-2.5 py-2 text-[10.5px] leading-relaxed text-danger">
              {error}
            </p>
          ) : null}

          <form onSubmit={onSubmit} className="mt-3 flex items-center gap-2">
            <div className="glass-field flex h-10 flex-1 items-center px-3">
              <label htmlFor="dashboard-ai" className="sr-only">
                {t.dashboard.askTheAssistant}
              </label>
              <input
                id="dashboard-ai"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={
                  quota?.remaining === 0
                    ? t.dashboard.dailyQuotaReached
                    : t.dashboard.askAnything
                }
                disabled={pending || quota?.remaining === 0}
                className="h-full w-full bg-transparent text-[12px] text-paper outline-none placeholder:text-muted-2/80 disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={pending || !value.trim() || quota?.remaining === 0}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-on-accent transition-colors hover:bg-accent-soft disabled:opacity-40"
              aria-label={t.dashboard.sendMessage}
            >
              <Send className="size-4" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[9.5px] text-muted-2">
              {quota
                ? format(t.dashboard.operationsUsed, { used: quota.used, limit: quota.limit })
                : t.dashboard.operationsPerDay}
            </p>
            <Link
              href="/assistant"
              className="inline-flex items-center gap-0.5 text-[10px] text-muted-2 transition-colors hover:text-paper"
            >
              {assistantMessages.length > 0
                ? t.dashboard.continueLabel
                : t.dashboard.fullAssistant}{" "}
              <ArrowUpRight className="size-2.5" />
            </Link>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
