-- ---------------------------------------------------------------------------
-- NOMAD — security hardening (Stage 1)
--
-- Apply AFTER 20261102000100_init.sql. This migration adds no tables, no
-- columns and touches no rows: it only replaces write policies and installs
-- one guard trigger. It is idempotent and safe to re-run.
--
-- Fixes:
--   F1  An editor could set trips.owner_id to their own id and become owner,
--       because RLS WITH CHECK can only evaluate the NEW row.
--   F2  viewer is documented as read-only, but expenses/group_expenses
--       INSERT policies admitted every trip member.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- F1 — ownership transfer is reserved for the current owner
-- ---------------------------------------------------------------------------

create or replace function public.prevent_trip_ownership_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.owner_id is distinct from old.owner_id
     and (select auth.uid()) is distinct from old.owner_id then
    raise exception 'only the trip owner can transfer ownership'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trips_protect_owner on public.trips;
create trigger trips_protect_owner
before update of owner_id on public.trips
for each row execute function public.prevent_trip_ownership_change();

-- ---------------------------------------------------------------------------
-- F2 — expenses: only owner/editor may write
-- ---------------------------------------------------------------------------

drop policy if exists "expenses_insert_member" on public.expenses;
drop policy if exists "expenses_insert_editor" on public.expenses;
create policy "expenses_insert_editor" on public.expenses
for insert to authenticated
with check (public.can_edit_trip(trip_id));

drop policy if exists "expenses_update_own_or_owner" on public.expenses;
drop policy if exists "expenses_update_editor" on public.expenses;
create policy "expenses_update_editor" on public.expenses
for update to authenticated
using (
  public.can_edit_trip(trip_id)
  and (created_by = (select auth.uid()) or public.trip_role(trip_id) = 'owner')
)
with check (
  public.can_edit_trip(trip_id)
  and (created_by = (select auth.uid()) or public.trip_role(trip_id) = 'owner')
);

drop policy if exists "expenses_delete_own_or_owner" on public.expenses;
drop policy if exists "expenses_delete_editor" on public.expenses;
create policy "expenses_delete_editor" on public.expenses
for delete to authenticated
using (
  public.can_edit_trip(trip_id)
  and (created_by = (select auth.uid()) or public.trip_role(trip_id) = 'owner')
);

-- ---------------------------------------------------------------------------
-- F2 — group_expenses: only owner/editor may write
-- ---------------------------------------------------------------------------

drop policy if exists "group_expenses_insert_member" on public.group_expenses;
drop policy if exists "group_expenses_insert_editor" on public.group_expenses;
create policy "group_expenses_insert_editor" on public.group_expenses
for insert to authenticated
with check (public.can_edit_trip(trip_id));

drop policy if exists "group_expenses_update_owner_or_payer" on public.group_expenses;
drop policy if exists "group_expenses_update_editor" on public.group_expenses;
create policy "group_expenses_update_editor" on public.group_expenses
for update to authenticated
using (
  public.can_edit_trip(trip_id)
  and (paid_by = (select auth.uid()) or public.trip_role(trip_id) = 'owner')
)
with check (
  public.can_edit_trip(trip_id)
  and (paid_by = (select auth.uid()) or public.trip_role(trip_id) = 'owner')
);

drop policy if exists "group_expenses_delete_owner_or_payer" on public.group_expenses;
drop policy if exists "group_expenses_delete_editor" on public.group_expenses;
create policy "group_expenses_delete_editor" on public.group_expenses
for delete to authenticated
using (
  public.can_edit_trip(trip_id)
  and (paid_by = (select auth.uid()) or public.trip_role(trip_id) = 'owner')
);
