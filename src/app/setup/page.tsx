import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Coins,
  Database,
  KeyRound,
  Map as MapIcon,
  Sparkles,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { featureState } from "@/lib/env.server";

export const metadata: Metadata = { title: "Setup" };

const services = [
  {
    key: "supabase" as const,
    name: "Supabase",
    purpose: "Authentication, Postgres, row level security and private document storage.",
    icon: Database,
    env: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    steps: [
      "Create a project at supabase.com and copy the Project URL and anon/publishable key.",
      "Run supabase/migrations/20261102000100_init.sql in the SQL editor (or `supabase db push`).",
      "In Authentication → URL Configuration set the Site URL to this app and add /auth/callback and /auth/confirm as redirect URLs.",
      "Email confirmation and password recovery need an SMTP sender configured in Supabase.",
    ],
  },
  {
    key: "ai" as const,
    name: "Google Gemini",
    purpose: "Server-only NOMAD AI: routes, budgets, recommendations and trip advice.",
    icon: Sparkles,
    env: ["GEMINI_API_KEY", "GEMINI_MODEL (optional)"],
    steps: [
      "Create a key at aistudio.google.com/apikey and add it to .env.local as GEMINI_API_KEY.",
      "Optional: set GEMINI_MODEL. The app falls back to a verified model when one is retired.",
      "The key is read only in server code and never shipped to the browser.",
    ],
  },
  {
    key: "mapbox" as const,
    name: "Mapbox",
    purpose: "Interactive world map and trip route previews.",
    icon: MapIcon,
    env: ["NEXT_PUBLIC_MAPBOX_TOKEN"],
    steps: [
      "Create a public access token with styles:tiles, styles:read and fonts:read scopes.",
      "Add it to .env.local as NEXT_PUBLIC_MAPBOX_TOKEN and restart the dev server.",
    ],
  },
] as const;

export default function SetupPage() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-8 sm:px-8">
      <header className="flex items-center justify-between">
        <Logo href="/dashboard" />
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-paper"
        >
          <ArrowLeft className="size-3.5" /> Back to app
        </Link>
      </header>

      <div className="mt-12 max-w-2xl">
        <p className="label-eyebrow mb-3">Environment</p>
        <h1 className="font-display text-[32px] font-semibold tracking-[-0.035em] sm:text-[40px]">
          Connect the services behind NOMAD
        </h1>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          NOMAD is fully built, but external services need your own credentials. Until
          a service is connected, its features show an explicit setup state — they never
          simulate results. Copy <code className="rounded bg-surface-1 px-1.5 py-0.5 text-[12px] text-paper">.env.example</code> to{" "}
          <code className="rounded bg-surface-1 px-1.5 py-0.5 text-[12px] text-paper">.env.local</code> and restart the server after each change.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {Object.entries(featureState).map(([name, connected]) => (
          <Badge key={name} tone={connected ? "positive" : "warning"} dot>
            {name === "fx" ? "Frankfurter (no key)" : name} {connected ? "connected" : "not connected"}
          </Badge>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {services.map((service) => {
          const connected = featureState[service.key];
          const Icon = service.icon;
          return (
            <GlassCard key={service.key} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-[14px] border border-line bg-surface-2 text-accent">
                    <Icon className="size-[18px]" strokeWidth={1.6} />
                  </span>
                  <div>
                    <h2 className="font-display text-[15px] font-semibold">{service.name}</h2>
                    <p className="mt-0.5 text-[11.5px] text-muted-2">{service.purpose}</p>
                  </div>
                </div>
                {connected ? (
                  <CheckCircle2 className="size-5 text-positive" aria-label="Connected" />
                ) : (
                  <CircleDashed className="size-5 text-muted-2" aria-label="Not connected" />
                )}
              </div>

              <div className="mt-5 space-y-1.5">
                {service.env.map((variable) => (
                  <div
                    key={variable}
                    className="flex items-center gap-2 rounded-lg border border-line bg-[#080d18]/45 px-2.5 py-2 font-mono text-[11px] text-muted"
                  >
                    <KeyRound className="size-3 shrink-0 text-muted-2" />
                    <span className="truncate">{variable}</span>
                  </div>
                ))}
              </div>

              <ol className="mt-4 space-y-2 text-[12px] leading-relaxed text-muted-2">
                {service.steps.map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-line text-[9px] text-muted">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </GlassCard>
          );
        })}

        <GlassCard className="flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-[14px] border border-line bg-surface-2 text-teal">
                <Coins className="size-[18px]" strokeWidth={1.6} />
              </span>
              <div>
                <h2 className="font-display text-[15px] font-semibold">Frankfurter</h2>
                <p className="mt-0.5 text-[11.5px] text-muted-2">
                  Exchange rates for the travel wallet.
                </p>
              </div>
            </div>
            <CheckCircle2 className="size-5 text-positive" aria-label="No key required" />
          </div>
          <p className="mt-5 text-[12px] leading-relaxed text-muted-2">
            Frankfurter is a free, keyless reference-rate API. NOMAD fetches it through
            its own server route with caching, and clearly reports when rates are
            unavailable — no hardcoded rates, ever.
          </p>
          <p className="mt-3 font-mono text-[11px] text-muted">api.frankfurter.app</p>
        </GlassCard>
      </div>

      <GlassCard className="mt-4" tone="accent">
        <h2 className="font-display text-[15px] font-semibold">Security rules in this build</h2>
        <ul className="mt-3 grid gap-2 text-[12.5px] leading-relaxed text-muted sm:grid-cols-2">
          <li>• AI and service keys exist only in server code.</li>
          <li>• Every mutation is re-validated with Zod on the server.</li>
          <li>• RLS derives access from auth.uid(), never client ids.</li>
          <li>• The AI daily quota is reserved inside Postgres.</li>
        </ul>
      </GlassCard>
    </div>
  );
}
