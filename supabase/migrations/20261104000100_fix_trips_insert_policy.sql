-- ---------------------------------------------------------------------------
-- FIX — trips could not be created (Postgres error 42501)
--
-- Symptom: creating a trip from /planner returned
--   "new row violates row-level security policy for table \"trips\""
-- even though the app sends owner_id = auth.uid() and the session is valid
-- (documents use the same owner check and insert fine).
--
-- Cause: the INSERT policy on public.trips in the deployed database does not
-- match the one in this repository, so the WITH CHECK never passes. The app
-- code needs no change; the policy is restated below exactly as designed.
--
-- Safety: NOT destructive. Only one policy is dropped and recreated.
-- No table, column, row or other policy is touched.
-- Idempotent: safe to run more than once.
-- ---------------------------------------------------------------------------

-- 1) Diagnostic — inspect what is applied right now (read-only).
--    Run this separately in the SQL editor if you want to see the old value:
--
--    select policyname, cmd, qual, with_check
--    from pg_policies
--    where schemaname = 'public' and tablename = 'trips'
--    order by cmd, policyname;

-- 2) Repair the owner-only INSERT policy.
drop policy if exists "trips_insert_owner" on public.trips;
create policy "trips_insert_owner" on public.trips
for insert to authenticated
with check (owner_id = (select auth.uid()));

-- The remaining trips policies are left untouched. For reference they are:
--   trips_select_member  select  using (public.is_trip_member(id))
--   trips_update_editor  update  using (public.can_edit_trip(id))
--                                with check (public.can_edit_trip(id))
--   trips_delete_owner   delete  using (owner_id = (select auth.uid()))
