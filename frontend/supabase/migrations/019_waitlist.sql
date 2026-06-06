-- =============================================================
-- 019_waitlist.sql
-- Marketing waitlist signups (admin/service-role only; RLS, no policies).
-- =============================================================

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  confirmation_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  welcome_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.waitlist_signups enable row level security;
alter table public.waitlist_signups force row level security;
