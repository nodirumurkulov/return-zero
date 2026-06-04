-- =============================================================
-- 011_incident_actions_timeline_rls.sql
-- Authenticated users may read/write incident_actions and incident_timeline
-- (required for investigate/approve API routes using createClient + RLS).
-- Mock catalog tables remain read-only for authenticated.
-- =============================================================

do $$
declare
  t text;
  incident_detail_tables text[] := array['incident_actions', 'incident_timeline'];
begin
  foreach t in array incident_detail_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_authenticated_read', t);
      execute format('drop policy if exists %I on public.%I', t || '_authenticated_all', t);
      execute format(
        'create policy %I on public.%I for all to authenticated using (true) with check (true)',
        t || '_authenticated_all', t
      );
    end if;
  end loop;
end $$;
