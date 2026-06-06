-- Waitlist pricing negotiation (post-confirmation sales chat)

create type public.negotiation_status as enum (
  'not_started',
  'in_progress',
  'accepted',
  'declined',
  'expired'
);

create type public.pricing_tier as enum ('teams', 'enterprise');

create type public.pricing_message_role as enum ('user', 'assistant', 'system');

alter table public.waitlist_signups
  add column negotiation_status public.negotiation_status not null default 'not_started',
  add column selected_tier public.pricing_tier,
  add column offered_price_cents integer,
  add column agreed_price_cents integer,
  add column negotiation_completed_at timestamptz;

create table public.waitlist_pricing_messages (
  id uuid primary key default gen_random_uuid(),
  waitlist_signup_id uuid not null references public.waitlist_signups (id) on delete cascade,
  role public.pricing_message_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index waitlist_pricing_messages_signup_created_idx
  on public.waitlist_pricing_messages (waitlist_signup_id, created_at);

create table public.waitlist_pricing_state (
  waitlist_signup_id uuid primary key references public.waitlist_signups (id) on delete cascade,
  current_offer_cents integer,
  user_budget_cents integer,
  company_signals jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.waitlist_pricing_messages enable row level security;
alter table public.waitlist_pricing_state enable row level security;
