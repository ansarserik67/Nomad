"use client";

import { ArrowDownUp, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { CardHeader, GlassCard } from "@/components/ui/glass-card";
import { format } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";
import { formatMoney } from "@/lib/utils";

type RatesPayload = { base: string; date: string; rates: Record<string, number> };

export function CurrencyConverter({
  homeCurrency,
  currencies,
}: {
  homeCurrency: string;
  currencies: string[];
}) {
  const { t } = useI18n();
  const [base, setBase] = useState(homeCurrency);
  const [target, setTarget] = useState(homeCurrency === "EUR" ? "USD" : "EUR");
  const [amount, setAmount] = useState("100");
  const [data, setData] = useState<RatesPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async (baseCode: string) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/fx/rates?base=${encodeURIComponent(baseCode)}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | RatesPayload
        | { error?: string }
        | null;
      if (id !== requestId.current) return;

      if (!response.ok || !payload || !("rates" in payload)) {
        setData(null);
        setError(
          (payload && "error" in payload && payload.error) || t.wallet.unavailable,
        );
        return;
      }
      setData(payload);
    } catch {
      if (id === requestId.current) {
        setData(null);
        setError(t.wallet.unreachable);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [t.wallet.unavailable, t.wallet.unreachable]);

  useEffect(() => {
    void load(base);
  }, [base, load]);

  const numericAmount = Number(amount.replace(",", "."));
  const rate = data?.rates[target];
  const converted =
    Number.isFinite(numericAmount) && typeof rate === "number" ? numericAmount * rate : null;

  const options = [...new Set([base, target, ...Object.keys(data?.rates ?? {}), ...currencies])]
    .filter(Boolean)
    .sort();

  function swap() {
    setBase(target);
    setTarget(base);
  }

  return (
    <GlassCard className="flex h-full flex-col">
      <CardHeader
        eyebrow={t.wallet.eyebrow}
        title={t.wallet.title}
        description={t.wallet.description}
        action={
          <button
            type="button"
            onClick={() => void load(base)}
            disabled={loading}
            className="rounded-lg p-1.5 text-muted-2 transition-colors hover:bg-surface-2 hover:text-paper disabled:opacity-40"
            aria-label={t.wallet.refreshRates}
          >
            <RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} />
          </button>
        }
      />

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <Field label={t.wallet.from} htmlFor="fx-base">
          <Select
            id="fx-base"
            value={base}
            onChange={(event) => setBase(event.target.value)}
          >
            {options.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </Field>
        <Button variant="secondary" size="icon" onClick={swap} aria-label={t.wallet.swap}>
          <ArrowDownUp className="size-3.5" />
        </Button>
        <Field label={t.wallet.to} htmlFor="fx-target">
          <Select
            id="fx-target"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          >
            {options.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-3">
        <Field label={t.wallet.amount} htmlFor="fx-amount">
          <Input
            id="fx-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="100"
          />
        </Field>
      </div>

      <div className="mt-4 rounded-[16px] border border-line bg-surface-1 p-4">
        {error ? (
          <p role="alert" className="text-[11.5px] leading-relaxed text-warning">
            {error}
          </p>
        ) : loading && !data ? (
          <div className="space-y-2">
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-2.5 w-48" />
          </div>
        ) : converted !== null ? (
          <>
            <p className="font-display text-[24px] font-semibold leading-none tracking-[-0.03em]">
              {formatMoney(converted, target, { maximumFractionDigits: 2 })}
            </p>
            <p className="mt-2 text-[10.5px] text-muted-2">
              {format(t.wallet.fromTo, { base, rate: rate ?? "", target })}
              {data?.date ? format(t.wallet.referenceDate, { date: data.date }) : ""}
            </p>
          </>
        ) : (
          <p className="text-[11.5px] text-muted-2">{t.wallet.choosePair}</p>
        )}
      </div>

      <p className="mt-auto pt-3 text-[9.5px] leading-relaxed text-muted-2">
        {t.wallet.indicative}
      </p>
    </GlassCard>
  );
}
