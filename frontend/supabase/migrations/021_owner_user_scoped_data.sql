-- =============================================================
-- 021_owner_user_scoped_data.sql
-- Per-user data isolation: each auth user owns their uploaded store
-- dataset, learned baselines, replay cursor, and incidents.
-- =============================================================

-- ---- 1. Add owner_user_id (nullable during transition) --------------------

alter table products add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table variants add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table customers add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table orders add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table line_items add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table refunds add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table collections add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table meta_ads_daily add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table google_ads_daily add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table inventory_movements add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table support_tickets add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table purchase_orders add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table po_line_items add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;

alter table incidents add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table agent_findings add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table incident_actions add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table incident_timeline add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table product_kpi_thresholds add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table product_baselines add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;
alter table business_reports add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;

do $$
begin
  if to_regclass('public.product_cost_overrides') is not null then
    execute 'alter table public.product_cost_overrides add column if not exists owner_user_id uuid references auth.users(id) on delete cascade';
  end if;
end $$;

-- ---- 2. Backfill existing rows to the first auth user, else wipe --------

do $$
declare
  uid uuid;
begin
  select id into uid from auth.users order by created_at limit 1;

  if uid is not null then
    update products set owner_user_id = uid where owner_user_id is null;
    update variants set owner_user_id = uid where owner_user_id is null;
    update customers set owner_user_id = uid where owner_user_id is null;
    update orders set owner_user_id = uid where owner_user_id is null;
    update line_items set owner_user_id = uid where owner_user_id is null;
    update refunds set owner_user_id = uid where owner_user_id is null;
    update collections set owner_user_id = uid where owner_user_id is null;
    update meta_ads_daily set owner_user_id = uid where owner_user_id is null;
    update google_ads_daily set owner_user_id = uid where owner_user_id is null;
    update inventory_movements set owner_user_id = uid where owner_user_id is null;
    update support_tickets set owner_user_id = uid where owner_user_id is null;
    update purchase_orders set owner_user_id = uid where owner_user_id is null;
    update po_line_items set owner_user_id = uid where owner_user_id is null;
    update incidents set owner_user_id = uid where owner_user_id is null;
    update agent_findings af
      set owner_user_id = i.owner_user_id
      from incidents i
      where af.incident_id = i.id and af.owner_user_id is null;
    update incident_actions ia
      set owner_user_id = i.owner_user_id
      from incidents i
      where ia.incident_id = i.id and ia.owner_user_id is null;
    update incident_timeline it
      set owner_user_id = i.owner_user_id
      from incidents i
      where it.incident_id = i.id and it.owner_user_id is null;
    update product_kpi_thresholds set owner_user_id = uid where owner_user_id is null;
    update product_baselines set owner_user_id = uid where owner_user_id is null;
    update business_reports set owner_user_id = uid where owner_user_id is null;
    if to_regclass('public.product_cost_overrides') is not null then
      update product_cost_overrides set owner_user_id = uid where owner_user_id is null;
    end if;
  else
    truncate table
      incident_actions, incident_timeline, agent_findings, incidents,
      product_kpi_thresholds, product_baselines, business_reports,
      line_items, refunds, po_line_items, inventory_movements, support_tickets,
      orders, variants, purchase_orders, products, customers, collections,
      meta_ads_daily, google_ads_daily
    restart identity cascade;
  end if;
end $$;

-- ---- 3. Drop dependent FKs and old PKs ----------------------------------

alter table variants drop constraint if exists variants_product_id_fkey;
alter table orders drop constraint if exists orders_customer_id_fkey;
alter table line_items drop constraint if exists line_items_order_id_fkey;
alter table line_items drop constraint if exists line_items_variant_id_fkey;
alter table line_items drop constraint if exists line_items_product_id_fkey;
alter table refunds drop constraint if exists refunds_order_id_fkey;
alter table inventory_movements drop constraint if exists inventory_movements_variant_id_fkey;
alter table support_tickets drop constraint if exists support_tickets_customer_id_fkey;
alter table po_line_items drop constraint if exists po_line_items_po_id_fkey;
alter table po_line_items drop constraint if exists po_line_items_variant_id_fkey;
alter table product_kpi_thresholds drop constraint if exists product_kpi_thresholds_product_id_fkey;
alter table product_baselines drop constraint if exists product_baselines_product_id_fkey;

do $$
begin
  if to_regclass('public.product_cost_overrides') is not null then
    execute 'alter table public.product_cost_overrides drop constraint if exists product_cost_overrides_product_id_fkey';
    execute 'alter table public.product_cost_overrides drop constraint if exists product_cost_overrides_pkey';
  end if;
end $$;

alter table products drop constraint if exists products_pkey;
alter table variants drop constraint if exists variants_pkey;
alter table customers drop constraint if exists customers_pkey;
alter table orders drop constraint if exists orders_pkey;
alter table line_items drop constraint if exists line_items_pkey;
alter table refunds drop constraint if exists refunds_pkey;
alter table collections drop constraint if exists collections_pkey;
alter table inventory_movements drop constraint if exists inventory_movements_pkey;
alter table support_tickets drop constraint if exists support_tickets_pkey;
alter table purchase_orders drop constraint if exists purchase_orders_pkey;
alter table po_line_items drop constraint if exists po_line_items_pkey;
alter table product_baselines drop constraint if exists product_baselines_pkey;

alter table product_kpi_thresholds drop constraint if exists product_kpi_thresholds_product_id_metric_key_key;
drop index if exists idx_product_kpi_thresholds_lookup;
drop index if exists idx_product_baselines_lookup;
drop index if exists meta_ads_daily_natural_key;
drop index if exists google_ads_daily_natural_key;

-- ---- 4. NOT NULL + composite PKs ----------------------------------------

alter table products alter column owner_user_id set not null;
alter table variants alter column owner_user_id set not null;
alter table customers alter column owner_user_id set not null;
alter table orders alter column owner_user_id set not null;
alter table line_items alter column owner_user_id set not null;
alter table refunds alter column owner_user_id set not null;
alter table collections alter column owner_user_id set not null;
alter table meta_ads_daily alter column owner_user_id set not null;
alter table google_ads_daily alter column owner_user_id set not null;
alter table inventory_movements alter column owner_user_id set not null;
alter table support_tickets alter column owner_user_id set not null;
alter table purchase_orders alter column owner_user_id set not null;
alter table po_line_items alter column owner_user_id set not null;
alter table incidents alter column owner_user_id set not null;
alter table agent_findings alter column owner_user_id set not null;
alter table incident_actions alter column owner_user_id set not null;
alter table incident_timeline alter column owner_user_id set not null;
alter table product_kpi_thresholds alter column owner_user_id set not null;
alter table product_baselines alter column owner_user_id set not null;
alter table business_reports alter column owner_user_id set not null;

alter table products add primary key (owner_user_id, product_id);
alter table variants add primary key (owner_user_id, variant_id);
alter table customers add primary key (owner_user_id, customer_id);
alter table orders add primary key (owner_user_id, order_id);
alter table line_items add primary key (owner_user_id, line_item_id);
alter table refunds add primary key (owner_user_id, refund_id);
alter table collections add primary key (owner_user_id, collection_id);
alter table inventory_movements add primary key (owner_user_id, movement_id);
alter table support_tickets add primary key (owner_user_id, ticket_id);
alter table purchase_orders add primary key (owner_user_id, po_id);
alter table po_line_items add primary key (owner_user_id, po_line_id);
alter table product_baselines add primary key (owner_user_id, product_id, metric_key);

create unique index product_kpi_thresholds_owner_product_metric_key
  on product_kpi_thresholds (owner_user_id, product_id, metric_key);
create index idx_product_kpi_thresholds_lookup
  on product_kpi_thresholds (owner_user_id, product_id, metric_key);
create index idx_product_baselines_lookup
  on product_baselines (owner_user_id, product_id, metric_key);
create unique index meta_ads_daily_natural_key
  on meta_ads_daily (owner_user_id, date, campaign_name, ad_name, placement);
create unique index google_ads_daily_natural_key
  on google_ads_daily (owner_user_id, date, campaign_name, ad_group);

create index idx_incidents_owner on incidents (owner_user_id);
create index idx_products_owner on products (owner_user_id);
create index idx_orders_owner on orders (owner_user_id);

-- ---- 5. Composite FKs -----------------------------------------------------

alter table variants
  add constraint variants_product_fkey
  foreign key (owner_user_id, product_id)
  references products (owner_user_id, product_id) on delete cascade;

alter table orders
  add constraint orders_customer_fkey
  foreign key (owner_user_id, customer_id)
  references customers (owner_user_id, customer_id) on delete cascade;

alter table line_items
  add constraint line_items_order_fkey
  foreign key (owner_user_id, order_id)
  references orders (owner_user_id, order_id) on delete cascade,
  add constraint line_items_variant_fkey
  foreign key (owner_user_id, variant_id)
  references variants (owner_user_id, variant_id) on delete cascade,
  add constraint line_items_product_fkey
  foreign key (owner_user_id, product_id)
  references products (owner_user_id, product_id) on delete cascade;

alter table refunds
  add constraint refunds_order_fkey
  foreign key (owner_user_id, order_id)
  references orders (owner_user_id, order_id) on delete cascade;

alter table inventory_movements
  add constraint inventory_movements_variant_fkey
  foreign key (owner_user_id, variant_id)
  references variants (owner_user_id, variant_id) on delete cascade;

alter table support_tickets
  add constraint support_tickets_customer_fkey
  foreign key (owner_user_id, customer_id)
  references customers (owner_user_id, customer_id) on delete cascade;

alter table po_line_items
  add constraint po_line_items_po_fkey
  foreign key (owner_user_id, po_id)
  references purchase_orders (owner_user_id, po_id) on delete cascade,
  add constraint po_line_items_variant_fkey
  foreign key (owner_user_id, variant_id)
  references variants (owner_user_id, variant_id) on delete cascade;

alter table product_kpi_thresholds
  add constraint product_kpi_thresholds_product_fkey
  foreign key (owner_user_id, product_id)
  references products (owner_user_id, product_id) on delete cascade;

alter table product_baselines
  add constraint product_baselines_product_fkey
  foreign key (owner_user_id, product_id)
  references products (owner_user_id, product_id) on delete cascade;

do $$
begin
  if to_regclass('public.product_cost_overrides') is not null then
    execute 'alter table public.product_cost_overrides alter column owner_user_id set not null';
    execute 'alter table public.product_cost_overrides add primary key (owner_user_id, product_id)';
    execute $fk$
      alter table public.product_cost_overrides
        add constraint product_cost_overrides_product_fkey
        foreign key (owner_user_id, product_id)
        references products (owner_user_id, product_id) on delete cascade
    $fk$;
  end if;
end $$;

-- ---- 6. Per-user replay_state -------------------------------------------

drop table if exists replay_state;

create table replay_state (
  owner_user_id uuid primary key references auth.users(id) on delete cascade,
  cursor        date,
  stream_start  date
);

alter table replay_state enable row level security;

-- ---- 7. Scoped reset_contract_data --------------------------------------

drop function if exists reset_contract_data();

create or replace function reset_contract_data(p_owner_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from p_owner_user_id
     and coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'not authorized to reset data for this user';
  end if;

  delete from incident_actions where owner_user_id = p_owner_user_id;
  delete from incident_timeline where owner_user_id = p_owner_user_id;
  delete from agent_findings where owner_user_id = p_owner_user_id;
  delete from incidents where owner_user_id = p_owner_user_id;
  delete from product_kpi_thresholds where owner_user_id = p_owner_user_id;
  delete from product_baselines where owner_user_id = p_owner_user_id;
  if to_regclass('public.product_cost_overrides') is not null then
    delete from product_cost_overrides where owner_user_id = p_owner_user_id;
  end if;
  delete from business_reports where owner_user_id = p_owner_user_id;
  delete from replay_state where owner_user_id = p_owner_user_id;

  delete from line_items where owner_user_id = p_owner_user_id;
  delete from refunds where owner_user_id = p_owner_user_id;
  delete from po_line_items where owner_user_id = p_owner_user_id;
  delete from inventory_movements where owner_user_id = p_owner_user_id;
  delete from support_tickets where owner_user_id = p_owner_user_id;
  delete from orders where owner_user_id = p_owner_user_id;
  delete from variants where owner_user_id = p_owner_user_id;
  delete from purchase_orders where owner_user_id = p_owner_user_id;
  delete from products where owner_user_id = p_owner_user_id;
  delete from customers where owner_user_id = p_owner_user_id;
  delete from collections where owner_user_id = p_owner_user_id;
  delete from meta_ads_daily where owner_user_id = p_owner_user_id;
  delete from google_ads_daily where owner_user_id = p_owner_user_id;
end;
$$;

-- ---- 8. RLS: owner_user_id = auth.uid() ---------------------------------

do $$
declare
  t text;
  scoped_tables text[] := array[
    'products','variants','customers','orders','line_items','refunds',
    'collections','meta_ads_daily','google_ads_daily','inventory_movements',
    'support_tickets','purchase_orders','po_line_items',
    'incidents','agent_findings','incident_actions','incident_timeline',
    'product_kpi_thresholds','product_baselines','business_reports','replay_state',
    'product_cost_overrides'
  ];
begin
  foreach t in array scoped_tables loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I', t || '_authenticated_read', t);
      execute format('drop policy if exists %I on public.%I', t || '_authenticated_all', t);
      execute format('drop policy if exists %I on public.%I', t || '_owner_all', t);
      execute format(
        'create policy %I on public.%I for all to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid())',
        t || '_owner_all', t
      );
    end if;
  end loop;
end $$;

-- ---- 9. SQL analytics functions: security invoker + tenant scope ---------

drop function if exists product_source_facts(integer);

create or replace function product_source_facts(
  p_window_days int default 30,
  p_asof date default null,
  p_owner_user_id uuid default null
)
returns table (
  product_id      text,
  sales_revenue   numeric,
  sales_units     numeric,
  refunds_amount  numeric,
  refunds_count   numeric,
  ads_spend       numeric,
  ads_revenue     numeric,
  support_count   numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with scope as (
    select coalesce(p_owner_user_id, auth.uid()) as uid
  ),
  win as (
    select hi, (hi - make_interval(days => p_window_days)) as lo
    from (
      select coalesce(p_asof::timestamptz + interval '1 day', max(o.created_at)) as hi
      from orders o, scope
      where o.owner_user_id = scope.uid
    ) anchor
  ),
  sales as (
    select li.product_id,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0)) as revenue,
           sum(li.quantity)                                             as units
    from line_items li
    cross join scope
    cross join win
    join orders o on o.owner_user_id = li.owner_user_id and o.order_id = li.order_id
    where o.owner_user_id = scope.uid
      and o.created_at > win.lo and o.created_at <= win.hi
    group by li.product_id
  ),
  refund_exploded as (
    select v.product_id,
           r.amount / nullif(jsonb_array_length(r.refund_line_items::jsonb), 0) as amt_alloc
    from refunds r
    cross join scope
    cross join win
    cross join lateral jsonb_array_elements_text(r.refund_line_items::jsonb) as elem(variant_id)
    join variants v on v.owner_user_id = r.owner_user_id and v.variant_id = elem.variant_id
    where r.owner_user_id = scope.uid
      and r.created_at > win.lo and r.created_at <= win.hi
  ),
  refunds_agg as (
    select product_id, sum(amt_alloc) as amount, count(*) as cnt
    from refund_exploded
    group by product_id
  ),
  paid as (
    select campaign_name, sum(spend_gbp) as spend
    from (
      select campaign_name, date, spend_gbp from google_ads_daily g, scope where g.owner_user_id = scope.uid
      union all
      select campaign_name, date, spend_gbp from meta_ads_daily m, scope where m.owner_user_id = scope.uid
    ) a, win
    where a.date > win.lo::date and a.date <= win.hi::date
    group by campaign_name
  ),
  campaign_product_rev as (
    select o.utm_campaign as campaign_name, li.product_id,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0)) as rev
    from orders o
    cross join scope
    cross join win
    join line_items li on li.owner_user_id = o.owner_user_id and li.order_id = o.order_id
    where o.owner_user_id = scope.uid
      and o.created_at > win.lo and o.created_at <= win.hi
      and o.utm_campaign is not null
    group by o.utm_campaign, li.product_id
  ),
  campaign_total_rev as (
    select campaign_name, sum(rev) as total_rev
    from campaign_product_rev
    group by campaign_name
  ),
  ads_agg as (
    select cpr.product_id,
           sum(p.spend * cpr.rev / nullif(ctr.total_rev, 0)) as spend,
           sum(cpr.rev)                                      as revenue
    from campaign_product_rev cpr
    join paid p                 on p.campaign_name = cpr.campaign_name
    join campaign_total_rev ctr on ctr.campaign_name = cpr.campaign_name
    group by cpr.product_id
  ),
  support_agg as (
    select related_product_id as product_id, count(*) as cnt
    from support_tickets st
    cross join scope
    cross join win
    where st.owner_user_id = scope.uid
      and st.created_at > win.lo and st.created_at <= win.hi
      and st.related_product_id is not null
    group by related_product_id
  )
  select p.product_id,
         coalesce(s.revenue, 0),
         coalesce(s.units, 0),
         coalesce(r.amount, 0),
         coalesce(r.cnt, 0),
         coalesce(a.spend, 0),
         coalesce(a.revenue, 0),
         coalesce(t.cnt, 0)
  from products p
  cross join scope
  left join sales s       on s.product_id = p.product_id
  left join refunds_agg r on r.product_id = p.product_id
  left join ads_agg a     on a.product_id = p.product_id
  left join support_agg t on t.product_id = p.product_id
  where p.owner_user_id = scope.uid;
$$;

create or replace function product_monthly_series(
  p_months int default 24,
  p_owner_user_id uuid default null
)
returns table (
  product_id      text,
  month           date,
  units           numeric,
  revenue         numeric,
  refund_amount   numeric,
  refund_count    numeric,
  ad_spend        numeric,
  ad_revenue      numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with scope as (
    select coalesce(p_owner_user_id, auth.uid()) as uid
  ),
  bounds as (
    select date_trunc('month', max(o.created_at))::date as last_month
    from orders o, scope
    where o.owner_user_id = scope.uid
  ),
  lo as (
    select (last_month - make_interval(months => p_months - 1))::date as from_month from bounds
  ),
  months as (
    select generate_series((select from_month from lo), (select last_month from bounds), interval '1 month')::date as month
  ),
  spine as (
    select p.product_id, m.month
    from products p
    cross join months m
    cross join scope
    where p.owner_user_id = scope.uid
  ),
  sales as (
    select li.product_id, date_trunc('month', o.created_at)::date as month,
           sum(li.quantity)                                              as units,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0))  as revenue
    from line_items li
    join orders o on o.owner_user_id = li.owner_user_id and o.order_id = li.order_id, scope
    where o.owner_user_id = scope.uid
      and o.created_at >= (select from_month from lo)
    group by 1, 2
  ),
  refunds_m as (
    select v.product_id, date_trunc('month', r.created_at)::date as month,
           sum(r.amount / nullif(jsonb_array_length(r.refund_line_items::jsonb), 0)) as amount,
           count(*) as cnt
    from refunds r
    cross join scope
    cross join lateral jsonb_array_elements_text(r.refund_line_items::jsonb) as elem(variant_id)
    join variants v on v.owner_user_id = r.owner_user_id and v.variant_id = elem.variant_id
    where r.owner_user_id = scope.uid
      and r.created_at >= (select from_month from lo)
    group by 1, 2
  ),
  paid_m as (
    select campaign_name, date_trunc('month', date)::date as month, sum(spend_gbp) as spend
    from (
      select campaign_name, date, spend_gbp from google_ads_daily g, scope where g.owner_user_id = scope.uid
      union all
      select campaign_name, date, spend_gbp from meta_ads_daily m, scope where m.owner_user_id = scope.uid
    ) a
    where a.date >= (select from_month from lo)
    group by 1, 2
  ),
  cpr_m as (
    select o.utm_campaign as campaign_name, date_trunc('month', o.created_at)::date as month, li.product_id,
           sum(li.quantity * li.price - coalesce(li.total_discount, 0)) as rev
    from orders o
    join line_items li on li.owner_user_id = o.owner_user_id and li.order_id = o.order_id, scope
    where o.owner_user_id = scope.uid
      and o.utm_campaign is not null and o.created_at >= (select from_month from lo)
    group by 1, 2, 3
  ),
  ctr_m as (
    select campaign_name, month, sum(rev) as total from cpr_m group by 1, 2
  ),
  ads_m as (
    select cpr.product_id, cpr.month,
           sum(p.spend * cpr.rev / nullif(ctr.total, 0)) as spend,
           sum(cpr.rev)                                  as revenue
    from cpr_m cpr
    join paid_m p  on p.campaign_name = cpr.campaign_name and p.month = cpr.month
    join ctr_m ctr on ctr.campaign_name = cpr.campaign_name and ctr.month = cpr.month
    group by 1, 2
  )
  select s.product_id, s.month,
         coalesce(sl.units, 0), coalesce(sl.revenue, 0),
         coalesce(rf.amount, 0), coalesce(rf.cnt, 0),
         coalesce(ad.spend, 0), coalesce(ad.revenue, 0)
  from spine s
  left join sales sl     on sl.product_id = s.product_id and sl.month = s.month
  left join refunds_m rf on rf.product_id = s.product_id and rf.month = s.month
  left join ads_m ad     on ad.product_id = s.product_id and ad.month = s.month
  order by s.product_id, s.month;
$$;

create or replace function product_daily_outflow(
  p_days int default 28,
  p_asof date default null,
  p_owner_user_id uuid default null
)
returns table (
  product_id        text,
  daily_outflow     numeric,
  current_balance   numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with scope as (
    select coalesce(p_owner_user_id, auth.uid()) as uid
  ),
  asof as (
    select coalesce(
      p_asof,
      (select max(im.date) from inventory_movements im, scope where im.owner_user_id = scope.uid)
    ) as d
  ),
  recent as (
    select v.product_id,
           sum(case when im.quantity_delta < 0 then -im.quantity_delta else 0 end)::numeric
             / nullif(p_days, 0) as daily_outflow
    from inventory_movements im
    cross join scope
    cross join asof
    join variants v on v.owner_user_id = im.owner_user_id and v.variant_id = im.variant_id
    where im.owner_user_id = scope.uid
      and im.date > asof.d - p_days and im.date <= asof.d
    group by v.product_id
  ),
  bal as (
    select v.product_id, sum(lb.running_balance) as current_balance
    from variants v
    cross join scope
    join lateral (
      select im2.running_balance
      from inventory_movements im2
      cross join asof
      where im2.owner_user_id = v.owner_user_id
        and im2.variant_id = v.variant_id
        and im2.date <= asof.d
      order by im2.date desc
      limit 1
    ) lb on true
    where v.owner_user_id = scope.uid
    group by v.product_id
  )
  select p.product_id, coalesce(r.daily_outflow, 0), coalesce(b.current_balance, 0)
  from products p
  cross join scope
  left join recent r on r.product_id = p.product_id
  left join bal b    on b.product_id = p.product_id
  where p.owner_user_id = scope.uid;
$$;
