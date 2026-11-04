-- ---------------------------------------------------------------------------
-- BOOKING MANAGER — public.bookings
--
-- One row per reservation the traveller holds: hotel, flight, transport,
-- activity or other. Populated manually by the user (for example after
-- completing a booking on Booking.com from the Hotel Finder), never scraped
-- and never invented by AI.
--
-- Safety: additive only. Creates a new table, its indexes, its RLS policies
-- and one updated_at trigger. No existing table, column, policy or row is
-- modified or removed. Idempotent: safe to run more than once.
--
-- Ownership model:
--   * user_id must equal auth.uid() for every write and every read.
--   * trip_id is optional; when present it must reference a trip the caller
--     can already see (public.is_trip_member), so a booking can never be
--     attached to somebody else's trip.
-- ---------------------------------------------------------------------------

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete set null,
  booking_type text not null
    check (booking_type in ('hotel', 'flight', 'transport', 'activity', 'other')),
  provider text,
  title text not null check (char_length(title) between 1 and 160),
  destination text,
  address text,
  check_in date,
  check_out date,
  guests integer not null default 1 check (guests between 1 and 50),
  total_price numeric(12, 2) not null default 0 check (total_price >= 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  booking_url text,
  confirmation_number text,
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_date_order
    check (check_out is null or check_in is null or check_out >= check_in)
);

create index if not exists bookings_user_idx on public.bookings (user_id, check_in desc);
create index if not exists bookings_trip_idx on public.bookings (trip_id);

alter table public.bookings enable row level security;

-- Read: only the traveller who owns the booking.
drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own" on public.bookings
for select to authenticated
using (user_id = (select auth.uid()));

-- Create: own booking, and only for a trip the traveller is a member of.
drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (trip_id is null or public.is_trip_member(trip_id))
);

-- Edit: own booking only, and the trip link stays inside the member's trips.
drop policy if exists "bookings_update_own" on public.bookings;
create policy "bookings_update_own" on public.bookings
for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (trip_id is null or public.is_trip_member(trip_id))
);

-- Delete: own booking only.
drop policy if exists "bookings_delete_own" on public.bookings;
create policy "bookings_delete_own" on public.bookings
for delete to authenticated
using (user_id = (select auth.uid()));

-- Keep updated_at honest on every edit (existing helper from the init migration).
drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();
