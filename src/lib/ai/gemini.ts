import "server-only";

import { ApiError, GoogleGenAI } from "@google/genai";

import { geminiApiKey, geminiModel, usesLegacyKeyVariable } from "@/lib/env.server";

export type GeminiMessage = { role: "user" | "assistant"; content: string };

export type GeminiCompletion = {
  text: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
};

export type GeminiFailureCode =
  | "ai_not_configured"
  | "invalid_api_key"
  | "billing_quota"
  | "rate_limited"
  | "model_unavailable"
  | "timeout"
  | "content_blocked"
  | "empty_response"
  | "provider_error";

/** Typed, user-safe failure. The message is for server logs, never for the UI. */
export class GeminiFailure extends Error {
  readonly code: GeminiFailureCode;
  readonly retryable: boolean;

  constructor(code: GeminiFailureCode, message: string, retryable = false) {
    super(message);
    this.name = "GeminiFailure";
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * Models verified against the live Gemini API with this project's key:
 * `gemini-3.5-flash` and `gemini-3.6-flash` answer 200. The 1.5 family and
 * `gemini-2.5-flash` answer 404 ("no longer available to new users"), so they
 * are intentionally excluded from the fallback chain.
 */
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.6-flash"];
const REQUEST_TIMEOUT_MS = 40_000;
const ATTEMPTS_PER_MODEL = 2;
const RETRY_BASE_DELAY_MS = 600;

let client: GoogleGenAI | null = null;
/** Remembered once a model answers, so later calls skip retired model names. */
let resolvedModel: string | null = null;
let warnedAboutLegacyKey = false;

function getClient(): GoogleGenAI {
  if (!geminiApiKey) {
    throw new GeminiFailure("ai_not_configured", "GEMINI_API_KEY is not set on the server");
  }

  if (!client) {
    if (usesLegacyKeyVariable && !warnedAboutLegacyKey) {
      warnedAboutLegacyKey = true;
      // Only the variable name is logged — never the key itself.
      console.warn(
        "AI: GEMINI_API_KEY is empty, falling back to the legacy OPENAI_API_KEY variable.",
      );
    }
    client = new GoogleGenAI({ apiKey: geminiApiKey });
  }

  return client;
}

/** Requested model first (GEMINI_MODEL), then the verified working models. */
export function modelCandidates(): string[] {
  const chain = [resolvedModel, geminiModel, ...FALLBACK_MODELS].filter(
    (value): value is string => Boolean(value),
  );
  return [...new Set(chain)];
}

/** The model that actually answered last, for display and usage accounting. */
export function activeModel(): string {
  return resolvedModel ?? geminiModel;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function classify(error: unknown): GeminiFailure {
  if (error instanceof GeminiFailure) return error;

  if (error instanceof ApiError) {
    const lower = (error.message ?? "").toLowerCase();
    const status = error.status;

    if (
      status === 401 ||
      status === 403 ||
      lower.includes("api key not valid") ||
      lower.includes("api_key_invalid")
    ) {
      return new GeminiFailure("invalid_api_key", `Gemini rejected the API key (HTTP ${status})`);
    }

    if (status === 429) {
      if (lower.includes("quota") || lower.includes("billing") || lower.includes("resource_exhausted")) {
        return new GeminiFailure("billing_quota", "Gemini quota or billing limit reached");
      }
      return new GeminiFailure("rate_limited", "Gemini rate limit reached", true);
    }

    if (status === 404) {
      return new GeminiFailure("model_unavailable", "Requested Gemini model is not available", true);
    }

    if (status >= 500) {
      return new GeminiFailure("provider_error", `Gemini is unavailable (HTTP ${status})`, true);
    }

    return new GeminiFailure("provider_error", `Gemini request failed (HTTP ${status})`);
  }

  if (error instanceof Error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return new GeminiFailure("timeout", "Gemini request timed out", true);
    }
    return new GeminiFailure("provider_error", error.message);
  }

  return new GeminiFailure("provider_error", "Unknown Gemini failure");
}

/**
 * Runs one chat completion through Gemini on the server.
 *
 * Behaviour:
 *  - tries `GEMINI_MODEL` first, then the verified fallback models;
 *  - retries transient failures (429/5xx/timeouts) with backoff;
 *  - moves straight to the next model when one is retired (HTTP 404);
 *  - hard-stops on a bad key or exhausted billing, because retrying cannot help;
 *  - never exposes the API key in errors or logs.
 */
export async function generateTravelReply(params: {
  systemInstruction: string;
  messages: GeminiMessage[];
}): Promise<GeminiCompletion> {
  const ai = getClient();

  const contents = params.messages
    .filter((message) => message.content.trim().length > 0)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  if (contents.length === 0) {
    throw new GeminiFailure("empty_response", "No usable messages in the request");
  }

  let lastFailure: GeminiFailure | null = null;

  for (const model of modelCandidates()) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: params.systemInstruction,
            temperature: 0.6,
            maxOutputTokens: 900,
            abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          },
        });

        const text = response.text?.trim();
        const blocked = response.promptFeedback?.blockReason;

        if (!text) {
          if (blocked) {
            throw new GeminiFailure("content_blocked", `Gemini blocked the prompt (${blocked})`);
          }
          throw new GeminiFailure("empty_response", "Gemini returned an empty reply", true);
        }

        resolvedModel = model;

        return {
          text,
          model,
          promptTokens: response.usageMetadata?.promptTokenCount ?? null,
          completionTokens: response.usageMetadata?.candidatesTokenCount ?? null,
        };
      } catch (raw) {
        const failure = classify(raw);
        lastFailure = failure;

        // Retrying cannot fix a bad key or a billing limit.
        if (failure.code === "invalid_api_key" || failure.code === "billing_quota") {
          throw failure;
        }

        // A retired model will fail the same way again: switch immediately.
        if (failure.code === "model_unavailable") break;

        if (!failure.retryable) throw failure;

        if (attempt < ATTEMPTS_PER_MODEL) {
          await sleep(RETRY_BASE_DELAY_MS * attempt + Math.floor(Math.random() * 250));
        }
      }
    }
  }

  throw lastFailure ?? new GeminiFailure("provider_error", "No Gemini model answered");
}
