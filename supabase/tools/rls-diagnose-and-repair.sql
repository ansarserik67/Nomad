-- ============================================================================
-- NOMAD — диагностика и ремонт RLS для записи данных
--
-- Зачем: приложение работает как роль `authenticated`, все таблицы защищены
-- RLS. Если политики в живой базе отличаются от репозитория, INSERT падает с
-- ошибкой 42501 (`new row violates row-level security policy`), даже когда код
-- корректен. Этот файл показывает реальное состояние политик, воспроизводит
-- ошибку и пересоздаёт политики ровно в том виде, в котором они описаны в
-- `supabase/migrations/20261102000100_init.sql`.
--
-- Выполнять в Supabase → SQL Editor, по шагам (шаг = один запуск).
-- Шаг 2 и 4 ничего не сохраняют: INSERT выполняется в транзакции с ROLLBACK.
-- RLS не отключается, данные не удаляются.
-- ============================================================================


-- ============================================================================
-- ШАГ 1. ДИАГНОСТИКА (только чтение)
-- ============================================================================
-- 1.1 Все политики на таблицу trips: должно быть 4 строки (SELECT/INSERT/
--     UPDATE/DELETE) и у INSERT — роль {authenticated}, тип POLICY.
select tablename, policyname, cmd, roles, permissive, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'trips'
order by cmd, policyname;

-- 1.2 Включён ли RLS и нет ли FORCE RLS (force не нужен, он мешает)
select c.relname,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('trips', 'trip_members', 'itinerary_items', 'expenses', 'documents', 'saved_destinations')
order by c.relname;

-- 1.3 Существуют ли helper-функции и security definer ли они
select p.proname,
       p.prosecdef as security_definer,
       pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_trip_member', 'trip_role', 'can_edit_trip')
order by p.proname;

-- 1.4 Триггеры на trips: ожидаются trips_set_updated_at (BEFORE UPDATE) и
--     trips_protect_owner (BEFORE UPDATE из security_hardening).
select tgname, pg_get_triggerdef(t.oid) as definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'trips' and not t.tgisinternal;


-- ============================================================================
-- ШАГ 2. САМОПРОВЕРКА — воспроизводит ошибку 42501 (данные не сохраняются)
-- ============================================================================
-- Берёт первый профиль из вашей базы, подставляет его в claim `sub` как будто
-- это вошедший пользователь, вставляет тестовую поездку и откатывает всё.
-- Успех = строка вернулась (INSERT разрешён). Ошибка 42501 = политика не та.
-- Если вместо этого приходит `permission denied to set role "authenticated"`,
-- шаг 2/4 пропустите: он необязателен, ремонт делает шаг 3.
begin;

select set_config(
         'request.jwt.claims',
         json_build_object('sub', p.id::text, 'role', 'authenticated', 'email', p.email)::text,
         true
       )
from public.profiles p
order by p.created_at
limit 1;

set local role authenticated;

insert into public.trips (owner_id, title, destination_city, destination_country, status)
values ((select auth.uid()), 'RLS self-test', 'Almaty', 'Kazakhstan', 'planning')
returning id, owner_id, title;

rollback;


-- ============================================================================
-- ШАГ 3. РЕМОНТ — пересоздаёт функции и политики записи (идемпотентно)
-- ============================================================================

-- 3.1 Helper-функции: security definer, чтобы политики не рекурсировали.
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

-- 3.2 trips
alter table public.trips enable row level security;
alter table public.trips no force row level security;

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

-- 3.3 trip_members
alter table public.trip_members enable row level security;

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

-- 3.4 itinerary_items (планы по дням)
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

-- 3.5 expenses
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

-- 3.6 documents (Travel Vault)
alter table public.documents enable row level security;

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

-- 3.7 saved_destinations
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


-- ============================================================================
-- ШАГ 4. ПОВТОРНАЯ САМОПРОВЕРКА — должна вернуть строку без ошибки 42501
-- ============================================================================
begin;

select set_config(
         'request.jwt.claims',
         json_build_object('sub', p.id::text, 'role', 'authenticated', 'email', p.email)::text,
         true
       )
from public.profiles p
order by p.created_at
limit 1;

set local role authenticated;

insert into public.trips (owner_id, title, destination_city, destination_country, status)
values ((select auth.uid()), 'RLS self-test after repair', 'Almaty', 'Kazakhstan', 'planning')
returning id, owner_id, title;

rollback;

-- 4.1 пропустите, если шаг 2 не выполнялся (нет прав на set role).
-- 4.2 Контрольный список политик после ремонта: 4 на trips, 4 на
--     itinerary_items, 4 на expenses.
select tablename, cmd, count(*) as policies
from pg_policies
where schemaname = 'public'
  and tablename in ('trips', 'trip_members', 'itinerary_items', 'expenses', 'documents', 'saved_destinations')
group by tablename, cmd
order by tablename, cmd;
