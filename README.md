# NOMAD

**Your entire journey. One intelligent space.**

NOMAD is a premium travel workspace built with Next.js App Router. Trips are the
single source of truth: the planner, wallet, group, vault, dashboard and AI assistant
all read and write the same trip records, protected by Supabase row level security.

This repository contains the **foundation and first product stage**: the complete
design system, authenticated application shell, dashboard, Discover, Trip Planner,
My Trips, a working trip workspace (itinerary, budget, group, vault), Travel Wallet
with live Frankfurter conversion, and the quota-controlled AI assistant.

> **Setup guide (RU): [SETUP.md](./SETUP.md)** — environment variables, Supabase
> migrations, Google OAuth configuration and troubleshooting.

---

## 1. Run it

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev
```

Open `http://localhost:3000`.

Without any keys, NOMAD runs in an honest **unconfigured preview**: the interface is
fully browsable, authentication and data features show explicit setup states, and the
assistant/map state exactly which variable is missing. Nothing is mocked.

### Verification

```bash
npm run typecheck
npm run lint
npm run build
```

---

## 2. Required environment variables

| Variable | Scope | Required for | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public | Auth, database, storage | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Auth, database, storage | Anon/publishable key; RLS enforces access |
| `GEMINI_API_KEY` | **server only** | NOMAD AI (Google Gemini) | Never prefix with `NEXT_PUBLIC` |
| `GEMINI_MODEL` | server only | NOMAD AI (Google Gemini) | Preferred model; retired models fall back automatically |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | public | Interactive map | Public token with `styles:tiles`, `styles:read`, `fonts:read` |
| `NEXT_PUBLIC_APP_URL` | public | Auth redirect fallback | Defaults to `http://localhost:3000` |

There is no service-role key in this project by design. Every read and write runs as
the signed-in user through RLS.

### External services

- **Supabase** — authentication, PostgreSQL, and the private `travel-documents` bucket.
- **Google Gemini** — NOMAD AI assistant. The owner's own key and billing are required.
- **Mapbox** — interactive globe and trip markers.
- **Frankfurter** — keyless reference exchange rates (`api.frankfurter.app`), proxied
  and cached by `/api/fx/rates`.

---

## 3. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run the migrations in `supabase/migrations/` **in filename
   order**:
   - [`20261102000100_init.sql`](supabase/migrations/20261102000100_init.sql) creates every
     table, index, trigger, RLS policy, RPC, and the private storage bucket. It is
     idempotent for policies and tables.
   - [`20261103000100_security_hardening.sql`](supabase/migrations/20261103000100_security_hardening.sql)
     replaces the trip and expense write policies and installs the ownership-transfer
     guard. It adds no tables or columns and is safe to re-run.
3. In **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` in development, your production origin otherwise.
   - Redirect URLs: `http://localhost:3000/auth/callback` and
     `http://localhost:3000/auth/confirm` (add the production equivalents).
4. Configure SMTP if you want confirmation and password-reset emails delivered
   (Authentication → Emails). The built-in sender is rate-limited.
5. Copy the Project URL and anon key into `.env.local`.

### Database model

| Table | Purpose |
| --- | --- |
| `profiles` | User profile, home currency, travel style |
| `trips` | Trip header: destination, dates, travellers, budget, status |
| `trip_members` | Per-trip roles (`owner` / `editor` / `viewer`) and pending invites |
| `itinerary_items` | Dated activities, locations, estimated costs |
| `expenses` | Actual expenses with currency and exchange rate to the trip currency |
| `group_expenses` | Split expenses and participants (schema ready, UI next stage) |
| `documents` | Private vault documents linked to a trip or personal |
| `ai_usage` | Append-only AI operations with reservation/finish lifecycle |
| `saved_destinations` | Discover shortlist |

Every user-owned table has RLS. Access is derived from `auth.uid()`, never from a
client-supplied user id. Trip access is resolved by security-definer helper functions
(`is_trip_member`, `trip_role`, `can_edit_trip`) to avoid recursive policies.

The storage bucket `travel-documents` is private and scoped to
`{userId}/...`. Downloads go through `/api/documents/[id]`, which checks ownership and
issues a 60-second signed URL. Vault files are owner-private by design.

### AI quota

The free plan allows **5 successful AI operations per UTC day**.

1. `claim_ai_operation(kind, model)` takes a per-user advisory lock, expires abandoned
   reservations after 10 minutes, counts today's `pending` + `success` rows, and inserts
   a `pending` row only if under the limit.
2. The Gemini call runs.
3. `finish_ai_operation(id, success, …)` marks the row `success` or `failed`.
   Failed calls do not count against the limit.

The limit is never enforced in the browser. When the quota is exhausted the API returns
`429` with the current quota; validation and provider failures return their own errors
and release the reservation.

---

## 4. Architecture

```
src/
  app/
    (auth)/               login, signup, reset, forgot-password + server actions
    (app)/                authenticated shell and product modules
      dashboard/          overview: trip, map, stats, budget, activity, AI widget
      discover/           curated catalog, filters, saved destinations
      trips/              list, trip workspace tabs, trip server actions
      planner/            create trips from scratch or a destination preset
      wallet/             per-trip budgets, analytics, live FX conversion
      group/              shared trips, roles, pending invitations
      vault/              private document library and uploads
      assistant/          full AI workspace with trip context and quota
      settings/           profile, account, service status
    api/
      ai/assistant/       validated AI route + quota enforcement
      fx/rates/           cached Frankfurter proxy
      documents/[id]/     ownership-checked signed downloads
    auth/                 PKCE callback, email OTP confirm, sign-out
  components/             UI kit, shell, dashboard, trips, wallet, auth, assistant
  lib/                    env, auth, data access, validation, FX, destinations, utils
supabase/migrations/      full schema, RLS, storage, quota functions
```

- **Server Components** fetch read models directly; **Server Actions** handle mutations
  with Zod validation and RLS-backed authorization.
- Secrets live only in [`src/lib/env.server.ts`](src/lib/env.server.ts) (`server-only`).
  Public configuration is isolated in [`src/lib/env.ts`](src/lib/env.ts).
- All incoming mutations and API bodies are validated with Zod.
- Empty, loading and error states exist for every data surface. There are no fake
  buttons or placeholder integrations.

---

## 5. What works now

- Dashboard with real aggregates once Supabase is connected: focus trip, world map,
  travel statistics, budget breakdown, recent activity, curated recommendations.
- Email/password authentication, email confirmation callback, password recovery,
  middleware session refresh and route protection.
- Discover with search, region filter, saved destinations, and planner presets.
- Trip creation and a trip workspace with itinerary, expenses, group invitations
  (roles + pending email invites), and private document upload/download.
- Wallet analytics in each trip's currency plus a live currency converter.
- AI assistant grounded in the user's trips, with mode selection and server-enforced
  quota.
- Settings with profile persistence, AI usage and integration status.

## 6. Deliberately not built yet (next stage)

- Group expense splitting UI and contribution settlement (`group_expenses` is ready).
- AI streaming replies and saved conversation history.
- Trip editing / archiving controls beyond status data.
- Email notifications (the notification panel is derived from real trip and document
  dates; no email delivery is claimed).
- Offline/PWA support, bookings, flights or availability integrations.

## 7. Verification status

`npm run typecheck`, `npm run lint` and `npm run build` pass. The application was
exercised in the browser with no Supabase credentials: routing, responsive shell,
empty states, configuration gating, and the live Frankfurter converter were verified.
The Supabase migration and authenticated flows require a real project and were not
executed against a live database in this environment.
