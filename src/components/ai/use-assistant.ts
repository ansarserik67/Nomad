"use client";

import { useCallback, useRef, useState } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ChatQuota = { used: number; limit: number; remaining: number };

export type AssistantLocale = "en" | "ru" | "kk";

type SendOptions = {
  mode?: "assistant" | "itinerary" | "budget_analysis" | "recommendations";
  tripId?: string | null;
  /** Interface language; the assistant answers in it. */
  locale?: AssistantLocale;
  /** Localized fallbacks for network and generic failures. */
  errors?: { generic: string; network: string };
};

export function useAssistant(initialQuota?: ChatQuota | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<ChatQuota | null>(initialQuota ?? null);
  const pendingRef = useRef(false);

  const send = useCallback(async (input: string, options: SendOptions = {}) => {
    const content = input.trim();
    if (!content || pendingRef.current) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setError(null);
    setPending(true);
    pendingRef.current = true;

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: text }) => ({ role, content: text })),
          mode: options.mode ?? "assistant",
          ...(options.locale ? { locale: options.locale } : {}),
          ...(options.tripId ? { tripId: options.tripId } : {}),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            reply?: string;
            quota?: ChatQuota;
            error?: string;
            code?: string;
          }
        | null;

      if (payload?.quota) setQuota(payload.quota);

      if (!response.ok || !payload?.reply) {
        setError(
          payload?.error ??
            options.errors?.generic ??
            "The assistant could not answer that request. Nothing was charged to your daily quota.",
        );
        return;
      }

      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: payload.reply as string },
      ]);
    } catch {
      setError(
        options.errors?.network ?? "Network error. Check your connection and try again.",
      );
    } finally {
      setPending(false);
      pendingRef.current = false;
    }
  }, [messages]);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, pending, error, quota, send, clear, setError };
}
