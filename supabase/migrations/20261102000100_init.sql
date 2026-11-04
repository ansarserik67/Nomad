-- ============================================================================
-- NOMAD — initial schema
-- Postgres / Supabase. All user-owned tables are protected by row level
-- security; access is always derived from auth.uid(), never from client input.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  home_city text,
  home_country text,
  home_currency text not null default 'USD' check (char_length(home_currency) = 3),
  travel_style text not null default 'balanced'
    check (travel_style in ('slow', 'balanced', 'fast', 'luxury', 'budget')),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select to authenticated using (id = (select auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert to authenticated with check (id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Create a profile for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  -- Activate any pending invitations addressed to this address.
  update public.trip_members
  set user_id = new.id,
      status = 'active',
      updated_at = now()
  where lower(email) = lower(coalesce(new.email, ''))
    and user_id is null;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  destination_city text not null,
  destination_country text not null,
  destination_country_code text,
  destination_lat double precision,
  destination_lng double precision,
  start_date date,
  end_date date,
  travelers integer not null default 1 check (travelers between 1 and 50),
  budget_amount numeric(12, 2) not null default 0 check (budget_amount >= 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  status text not null default 'planning'
    check (status in ('planning', 'upcoming', 'active', 'completed', 'archived')),
  cover_hue integer not null default 222 check (cover_hue between 0 and 360),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_date_order check (end_date is null or start_date is null or end_date >= start_date)
);

create index if not exists trips_owner_idx on public.trips (owner_id, start_date desc);
create index if not exists trips_status_idx on public.trips (status, start_date);

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

alter table public.trips enable row level security;

-- ---------------------------------------------------------------------------
-- trip_members
-- ---------------------------------------------------------------------------
create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  email text not null,
  role text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'active')),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, email)
);

create index if not exists trip_members_trip_idx on public.trip_members (trip_id);
create index if not exists trip_members_user_idx on public.trip_members (user_id);
create index if not exists trip_members_email_idx on public.trip_members (lower(email));

drop trigger if exists trip_members_set_updated_at on public.trip_members;
create trigger trip_members_set_updated_at
before update on public.trip_members
for each row execute function public.set_updated_at();

alter table public.trip_members enable row level security;

-- Security-definer helpers: they bypass RLS internally, which keeps the
-- policies on trips / trip_members free of recursive lookups.
create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.trips t
    where t.id = p_trip_id and t.owner_id = (select auth.uid())
  ) or exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function public.trip_role(p_trip_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when exists (
      select 1 from public.trips t
      where t.id = p_trip_id and t.owner_id = (select auth.uid())
    ) then 'owner'
    else (
      select m.role from public.trip_members m
      where m.trip_id = p_trip_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
      limit 1
    )
  end;
$$;

create or replace function public.can_edit_trip(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.trip_role(p_trip_id) in ('owner', 'editor'), false);
$$;

drop policy if exists "trips_select_member" on public.trips;
create policy "trips_select_member" on public.trips
for select to authenticated using (public.is_trip_member(id));

drop policy if exists "trips_insert_owner" on public.trips;
create policy "trips_insert_owner" on public.trips
for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "trips_update_editor" on public.trips;
create policy "trips_update_editor" on public.trips
for update to authenticated
using (public.can_edit_trip(id))
with check (public.can_edit_trip(id));

drop policy if exists "trips_delete_owner" on public.trips;
create policy "trips_delete_owner" on public.trips
for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "trip_members_select" on public.trip_members;
create policy "trip_members_select" on public.trip_members
for select to authenticated
using (
  user_id = (select auth.uid())
  or lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  or public.is_trip_member(trip_id)
);

drop policy if exists "trip_members_insert_owner" on public.trip_members;
create policy "trip_members_insert_owner" on public.trip_members
for insert to authenticated
with check (public.trip_role(trip_id) = 'owner');

drop policy if exists "trip_members_update_owner" on public.trip_members;
create policy "trip_members_update_owner" on public.trip_members
for update to authenticated
using (public.trip_role(trip_id) = 'owner')
with check (public.trip_role(trip_id) = 'owner');

drop policy if exists "trip_members_delete_owner_or_self" on public.trip_members;
create policy "trip_members_delete_owner_or_self" on public.trip_members
for delete to authenticated
using (public.trip_role(trip_id) = 'owner' or user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- itinerary_items
-- ---------------------------------------------------------------------------
create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  description text,
  category text not null default 'activity'
    check (category in ('activity', 'food', 'transport', 'stay', 'note')),
  day_date date,
  start_time time,
  end_time time,
  location_name text,
  lat double precision,
  lng double precision,
  cost_amount numeric(12, 2) not null default 0 check (cost_amount >= 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  status text not null default 'planned' check (status in ('planned', 'booked', 'done')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists itinerary_trip_day_idx
  on public.itinerary_items (trip_id, day_date, start_time);
create index if not exists itinerary_created_by_idx on public.itinerary_items (created_by);

drop trigger if exists itinerary_set_updated_at on public.itinerary_items;
create trigger itinerary_set_updated_at
before update on public.itinerary_items
for each row execute function public.set_updated_at();

alter table public.itinerary_items enable row level security;

drop policy if exists "itinerary_select_member" on public.itinerary_items;
create policy "itinerary_select_member" on public.itinerary_items
for select to authenticated using (public.is_trip_member(trip_id));

drop policy if exists "itinerary_insert_editor" on public.itinerary_items;
create policy "itinerary_insert_editor" on public.itinerary_items
for insert to authenticated with check (public.can_edit_trip(trip_id));

drop policy if exists "itinerary_update_editor" on public.itinerary_items;
create policy "itinerary_update_editor" on public.itinerary_items
for update to authenticated
using (public.can_edit_trip(trip_id))
with check (public.can_edit_trip(trip_id));

drop policy if exists "itinerary_delete_editor" on public.itinerary_items;
create policy "itinerary_delete_editor" on public.itinerary_items
for delete to authenticated using (public.can_edit_trip(trip_id));

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  title text not null check (char_length(title) between 1 and 140),
  category text not null default 'other'
    check (category in ('flights', 'stay', 'food', 'transport', 'activities', 'shopping', 'other')),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  exchange_rate numeric(14, 6) not null default 1 check (exchange_rate > 0),
  spent_on date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_trip_idx on public.expenses (trip_id, spent_on desc);
create index if not exists expenses_created_by_idx on public.expenses (created_by);

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

alter table public.expenses enable row level security;

drop policy if exists "expenses_select_member" on public.expenses;
create policy "expenses_select_member" on public.expenses
for select to authenticated using (public.is_trip_member(trip_id));

drop policy if exists "expenses_insert_member" on public.expenses;
create policy "expenses_insert_member" on public.expenses
for insert to authenticated with check (public.is_trip_member(trip_id));

drop policy if exists "expenses_update_own_or_owner" on public.expenses;
create policy "expenses_update_own_or_owner" on public.expenses
for update to authenticated
using (created_by = (select auth.uid()) or public.trip_role(trip_id) = 'owner')
with check (created_by = (select auth.uid()) or public.trip_role(trip_id) = 'owner');

drop policy if exists "expenses_delete_own_or_owner" on public.expenses;
create policy "expenses_delete_own_or_owner" on public.expenses
for delete to authenticated
using (created_by = (select auth.uid()) or public.trip_role(trip_id) = 'owner');

-- ---------------------------------------------------------------------------
-- group_expenses (shared / split costs)
-- ---------------------------------------------------------------------------
create table if not exists public.group_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  expense_id uuid references public.expenses (id) on delete set null,
  paid_by uuid references public.profiles (id) on delete set null,
  title text not null check (char_length(title) between 1 and 140),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  split_type text not null default 'equal' check (split_type in ('equal', 'custom')),
  participants jsonb not null default '[]'::jsonb,
  settled boolean not null default false,
  spent_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists group_expenses_trip_idx on public.group_expenses (trip_id, spent_on desc);
create index if not exists group_expenses_paid_by_idx on public.group_expenses (paid_by);

drop trigger if exists group_expenses_set_updated_at on public.group_expenses;
create trigger group_expenses_set_updated_at
before update on public.group_expenses
for each row execute function public.set_updated_at();

alter table public.group_expenses enable row level security;

drop policy if exists "group_expenses_select_member" on public.group_expenses;
create policy "group_expenses_select_member" on public.group_expenses
for select to authenticated using (public.is_trip_member(trip_id));

drop policy if exists "group_expenses_insert_member" on public.group_expenses;
create policy "group_expenses_insert_member" on public.group_expenses
for insert to authenticated with check (public.is_trip_member(trip_id));

drop policy if exists "group_expenses_update_owner_or_payer" on public.group_expenses;
create policy "group_expenses_update_owner_or_payer" on public.group_expenses
for update to authenticated
using (paid_by = (select auth.uid()) or public.trip_role(trip_id) = 'owner')
with check (paid_by = (select auth.uid()) or public.trip_role(trip_id) = 'owner');

drop policy if exists "group_expenses_delete_owner_or_payer" on public.group_expenses;
create policy "group_expenses_delete_owner_or_payer" on public.group_expenses
for delete to authenticated
using (paid_by = (select auth.uid()) or public.trip_role(trip_id) = 'owner');

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete set null,
  title text not null check (char_length(title) between 1 and 140),
  category text not null default 'other'
    check (category in ('ticket', 'booking', 'passport', 'insurance', 'receipt', 'other')),
  file_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  expires_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_owner_idx on public.documents (owner_id, created_at desc);
create index if not exists documents_trip_idx on public.documents (trip_id, created_at desc);

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

alter table public.documents enable row level security;

-- Vault files are private to their owner. Trip membership does not grant file
-- access, because storage objects live in the owner's private folder.
drop policy if exists "documents_select_own_or_member" on public.documents;
drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own" on public.documents
for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own" on public.documents
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and (trip_id is null or public.is_trip_member(trip_id))
);

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own" on public.documents
for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own" on public.documents
for delete to authenticated using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- ai_usage
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'assistant'
    check (kind in ('assistant', 'itinerary', 'budget_analysis', 'recommendations')),
  model text not null,
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed')),
  prompt_tokens integer,
  completion_tokens integer,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_usage_user_day_idx
  on public.ai_usage (user_id, created_at desc);
create index if not exists ai_usage_status_idx on public.ai_usage (status, created_at);

alter table public.ai_usage enable row level security;

drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own" on public.ai_usage
for select to authenticated using (user_id = (select auth.uid()));

-- Writes happen exclusively through the security-definer functions below,
-- so the daily quota cannot be bypassed by a modified client.
revoke insert, update, delete on public.ai_usage from anon, authenticated;

-- Atomically reserve one free AI operation. Returns null when the quota for
-- the current UTC day is exhausted. Failed requests are marked 'failed' by
-- finish_ai_operation and no longer count toward the quota.
create or replace function public.claim_ai_operation(p_kind text, p_model text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_used integer;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_kind not in ('assistant', 'itinerary', 'budget_analysis', 'recommendations') then
    raise exception 'invalid kind' using errcode = '22023';
  end if;

  -- Serialise quota checks per user so parallel requests cannot overshoot.
  perform pg_advisory_xact_lock(hashtextextended((select auth.uid())::text, 0));

  -- Abandoned reservations (e.g. crashed request) expire after 10 minutes.
  delete from public.ai_usage
  where user_id = (select auth.uid())
    and status = 'pending'
    and created_at < now() - interval '10 minutes';

  select count(*) into v_used
  from public.ai_usage
  where user_id = (select auth.uid())
    and status in ('pending', 'success')
    and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';

  if v_used >= 5 then
    return null;
  end if;

  insert into public.ai_usage (user_id, kind, model, status)
  values ((select auth.uid()), p_kind, left(coalesce(p_model, 'unknown'), 80), 'pending')
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.finish_ai_operation(
  p_id uuid,
  p_success boolean,
  p_prompt_tokens integer default null,
  p_completion_tokens integer default null,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_used integer;
begin
  update public.ai_usage
  set status = case when p_success then 'success' else 'failed' end,
      prompt_tokens = p_prompt_tokens,
      completion_tokens = p_completion_tokens,
      error_message = left(coalesce(p_error, ''), 500),
      completed_at = now()
  where id = p_id and user_id = (select auth.uid());

  select count(*) into v_used
  from public.ai_usage
  where user_id = (select auth.uid())
    and status in ('pending', 'success')
    and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';

  return jsonb_build_object('used', v_used, 'limit', 5, 'remaining', greatest(5 - v_used, 0));
end;
$$;

create or replace function public.ai_usage_today()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with used as (
    select count(*)::integer as c
    from public.ai_usage
    where user_id = (select auth.uid())
      and status in ('pending', 'success')
      and created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'
  )
  select jsonb_build_object('used', c, 'limit', 5, 'remaining', greatest(5 - c, 0))
  from used;
$$;

-- ---------------------------------------------------------------------------
-- saved_destinations
-- ---------------------------------------------------------------------------
create table if not exists public.saved_destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  city text not null,
  country text not null,
  country_code text not null,
  lat double precision,
  lng double precision,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, city, country_code)
);

create index if not exists saved_destinations_user_idx
  on public.saved_destinations (user_id, created_at desc);

alter table public.saved_destinations enable row level security;

drop policy if exists "saved_destinations_select_own" on public.saved_destinations;
create policy "saved_destinations_select_own" on public.saved_destinations
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "saved_destinations_insert_own" on public.saved_destinations;
create policy "saved_destinations_insert_own" on public.saved_destinations
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "saved_destinations_delete_own" on public.saved_destinations;
create policy "saved_destinations_delete_own" on public.saved_destinations
for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- invite_trip_member — owners invite by email; known accounts attach instantly.
-- ---------------------------------------------------------------------------
create or replace function public.invite_trip_member(
  p_trip_id uuid,
  p_email text,
  p_role text default 'viewer'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(trim(p_email));
  v_user_id uuid;
  v_member_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if public.trip_role(p_trip_id) <> 'owner' then
    raise exception 'only the trip owner can invite members' using errcode = '42501';
  end if;
  if p_role not in ('editor', 'viewer') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;

  select id into v_user_id from public.profiles where lower(email) = v_email limit 1;

  insert into public.trip_members (trip_id, user_id, email, role, status, invited_by)
  values (
    p_trip_id,
    v_user_id,
    v_email,
    p_role,
    case when v_user_id is null then 'pending' else 'active' end,
    (select auth.uid())
  )
  on conflict (trip_id, email) do update
    set role = excluded.role,
        user_id = coalesce(trip_members.user_id, excluded.user_id),
        status = case
          when trip_members.user_id is not null then 'active'
          else excluded.status
        end,
        updated_at = now()
  returning id into v_member_id;

  return jsonb_build_object(
    'id', v_member_id,
    'email', v_email,
    'status', case when v_user_id is null then 'pending' else 'active' end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: private bucket for travel documents, one folder per user.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'travel-documents',
  'travel-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]
)
on conflict (id) do nothing;

drop policy if exists "travel_documents_select_own" on storage.objects;
create policy "travel_documents_select_own" on storage.objects
for select to authenticated
using (
  bucket_id = 'travel-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "travel_documents_insert_own" on storage.objects;
create policy "travel_documents_insert_own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'travel-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "travel_documents_delete_own" on storage.objects;
create policy "travel_documents_delete_own" on storage.objects
for delete to authenticated
using (
  bucket_id = 'travel-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

grant execute on function public.claim_ai_operation(text, text) to authenticated;
grant execute on function public.finish_ai_operation(uuid, boolean, integer, integer, text) to authenticated;
grant execute on function public.ai_usage_today() to authenticated;
grant execute on function public.invite_trip_member(uuid, text, text) to authenticated;
