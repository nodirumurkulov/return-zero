-- Add importing status for async mock store connect.
-- Repair prod drift: enum missing despite migration history.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'store_connection_status'
  ) then
    create type public.store_connection_status as enum (
      'pending', 'connected', 'error', 'disconnected'
    );
  end if;
end $$;

alter type public.store_connection_status add value if not exists 'importing' before 'connected';

do $$
begin
  if exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'store_connections'
      and c.column_name = 'status'
      and c.data_type = 'text'
  ) then
    alter table public.store_connections
      alter column status drop default;

    alter table public.store_connections
      alter column status type public.store_connection_status
      using (
        case lower(btrim(status))
          when 'pending' then 'pending'::public.store_connection_status
          when 'importing' then 'importing'::public.store_connection_status
          when 'syncing' then 'importing'::public.store_connection_status
          when 'connected' then 'connected'::public.store_connection_status
          when 'error' then 'error'::public.store_connection_status
          when 'disconnected' then 'disconnected'::public.store_connection_status
          else 'pending'::public.store_connection_status
        end
      );

    alter table public.store_connections
      alter column status set default 'pending'::public.store_connection_status;

    alter table public.store_connections
      alter column status set not null;
  end if;
end $$;
