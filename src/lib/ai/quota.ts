import "server-only";

import type { AiQuota } from "@/lib/database.types";
import type { ServerSupabaseClient } from "@/lib/supabase/server";
import { currentUtcDayStart } from "@/lib/utils";

export const AI_DAILY_LIMIT = 5;

function normalizeQuota(value: unknown): AiQuota | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const used = Number(record.used);
  const limit = Number(record.limit ?? AI_DAILY_LIMIT);
  const remaining = Number(record.remaining);
  if (![used, limit, remaining].every(Number.isFinite)) return null;
  return {
    used: Math.max(0, used),
    limit: Math.max(1, limit),
    remaining: Math.max(0, remaining),
  };
}

/**
 * Reads today's quota via the database function. Falls back to a direct count
 * when the migration's function is not installed yet — the limit itself is
 * still enforced by claim_ai_operation inside Postgres.
 */
export async function getAiQuota(
  supabase: ServerSupabaseClient,
): Promise<AiQuota | null> {
  const { data, error } = await supabase.rpc("ai_usage_today");
  if (!error) {
    const parsed = normalizeQuota(data);
    if (parsed) return parsed;
  }

  const { count, error: countError } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .gte("created_at", currentUtcDayStart().toISOString())
    .in("status", ["pending", "success"]);

  if (countError) return null;

  const used = count ?? 0;
  return { used, limit: AI_DAILY_LIMIT, remaining: Math.max(AI_DAILY_LIMIT - used, 0) };
}

export function quotaFromResult(value: unknown): AiQuota | null {
  return normalizeQuota(value);
}
