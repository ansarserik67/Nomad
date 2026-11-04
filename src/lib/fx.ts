import "server-only";

const FRANKFURTER_URL = "https://api.frankfurter.app";

export type FxRates = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

export type FxResult = { data: FxRates; error?: never } | { data?: never; error: string };

export async function getRates(base: string): Promise<FxResult> {
  const normalized = base.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    return { error: "Use a three-letter currency code." };
  }

  try {
    const response = await fetch(
      `${FRANKFURTER_URL}/latest?from=${encodeURIComponent(normalized)}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(7000),
      },
    );

    if (!response.ok) {
      return { error: `Exchange rates are unavailable (Frankfurter HTTP ${response.status}).` };
    }

    const payload = (await response.json()) as unknown;
    if (!isRatesPayload(payload)) {
      return { error: "Frankfurter returned an unexpected response." };
    }

    return { data: payload };
  } catch (error) {
    console.error("Frankfurter request failed", error);
    return { error: "Exchange rates are currently unreachable. Try again shortly." };
  }
}

function isRatesPayload(value: unknown): value is FxRates {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (typeof record.base !== "string" || typeof record.date !== "string") return false;
  if (!record.rates || typeof record.rates !== "object") return false;
  return Object.values(record.rates as Record<string, unknown>).every(
    (rate) => typeof rate === "number" && Number.isFinite(rate),
  );
}
