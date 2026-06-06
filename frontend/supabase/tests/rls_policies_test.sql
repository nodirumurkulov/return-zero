-- =============================================================
-- rls_policies_test.sql
-- Multi-tenant RLS assertions: anon denial, org-scoped reads/writes, cross-tenant isolation.
-- Run: `bun run db:reset` then `bun run db:test:rls` (CI also runs `bun run seed` first).
-- Any failed assertion RAISEs, aborting under `psql -v ON_ERROR_STOP=1`.
-- =============================================================

\echo '== setup: two orgs, users, and sample rows (as postgres) =='
do $$
declare
  org_a uuid := 'aaaaaaaa-1111-1111-1111-111111111111';
  org_b uuid := 'bbbbbbbb-2222-2222-2222-222222222222';
  user_a uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  user_b uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  store_a uuid;
  store_b uuid;
  product_a uuid := 'aaaaaaaa-1111-1111-1111-111111111101';
  product_b uuid := 'bbbbbbbb-2222-2222-2222-222222222201';
  metric_a uuid;
  metric_b uuid;
  incident_a uuid := 'aaaaaaaa-1111-1111-1111-111111111201';
  incident_b uuid := 'bbbbbbbb-2222-2222-2222-222222222201';
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at
  ) values
    (user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'rls-user-a@test.local', crypt('test-password', gen_salt('bf')), now(), now(), now()),
    (user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'rls-user-b@test.local', crypt('test-password', gen_salt('bf')), now(), now(), now())
  on conflict (id) do nothing;

  insert into public.organizations (id, name, slug) values
    (org_a, 'RLS Org A', 'rls-org-a'),
    (org_b, 'RLS Org B', 'rls-org-b')
  on conflict (id) do nothing;

  insert into public.organization_members (organization_id, user_id, role) values
    (org_a, user_a, 'owner'),
    (org_b, user_b, 'owner')
  on conflict (organization_id, user_id) do nothing;

  select id into store_a
  from public.store_connections
  where organization_id = org_a
  limit 1;

  select id into store_b
  from public.store_connections
  where organization_id = org_b
  limit 1;

  if store_a is null or store_b is null then
    raise exception 'FAIL: setup missing store_connections for test orgs';
  end if;

  update public.organizations
  set active_store_id = store_a
  where id = org_a;

  update public.organizations
  set active_store_id = store_b
  where id = org_b;

  insert into public.products (id, organization_id, store_id, external_id, title) values
    (product_a, org_a, store_a, 'prod_a', 'Product A'),
    (product_b, org_b, store_b, 'prod_b', 'Product B')
  on conflict (id) do nothing;

  select id into metric_a
  from public.metric_definitions
  where organization_id = org_a and metric_key = 'return_rate'
  limit 1;

  select id into metric_b
  from public.metric_definitions
  where organization_id = org_b and metric_key = 'return_rate'
  limit 1;

  insert into public.incidents (
    id, organization_id, store_id, title, status, severity, product_id, affected_kpi_keys
  ) values
    (incident_a, org_a, store_a, 'Incident A', 'detected', 'medium', product_a, array['return_rate']),
    (incident_b, org_b, store_b, 'Incident B', 'detected', 'medium', product_b, array['return_rate'])
  on conflict (id) do nothing;

  insert into public.product_kpi_thresholds (
    organization_id, product_id, metric_definition_id, threshold
  ) values
    (org_a, product_a, metric_a, 0.12),
    (org_b, product_b, metric_b, 0.12)
  on conflict (organization_id, product_id, metric_definition_id) do nothing;
end $$;

\echo '== anon: reads return 0 rows =='
set role anon;
do $$ declare c int;
begin
  select count(*) into c from public.products;
  if c <> 0 then raise exception 'FAIL: anon read products = %', c; end if;
  select count(*) into c from public.incidents;
  if c <> 0 then raise exception 'FAIL: anon read incidents = %', c; end if;
  select count(*) into c from public.product_kpi_thresholds;
  if c <> 0 then raise exception 'FAIL: anon read product_kpi_thresholds = %', c; end if;
  raise notice 'PASS: anon sees 0 rows';
end $$;

\echo '== anon: writes denied =='
do $$ begin
  begin
    insert into public.incidents (organization_id, title)
    values ('aaaaaaaa-1111-1111-1111-111111111111', 'anon-should-fail');
    raise exception 'FAIL: anon inserted into incidents';
  exception when insufficient_privilege then
    raise notice 'PASS: anon insert into incidents denied';
  end;
end $$;
reset role;

\echo '== user A: sees only org A data =='
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false);
set role authenticated;
do $$ declare c int;
begin
  select count(*) into c from public.products;
  if c <> 1 then raise exception 'FAIL: user A read products = % (expected 1)', c; end if;
  select count(*) into c from public.incidents;
  if c <> 1 then raise exception 'FAIL: user A read incidents = % (expected 1)', c; end if;
  select count(*) into c from public.product_kpi_thresholds;
  if c <> 1 then raise exception 'FAIL: user A read thresholds = % (expected 1)', c; end if;
  if not exists (
    select 1 from public.products where external_id = 'prod_a'
  ) then
    raise exception 'FAIL: user A cannot see org A product';
  end if;
  if exists (
    select 1 from public.products where external_id = 'prod_b'
  ) then
    raise exception 'FAIL: user A can see org B product (cross-tenant leak)';
  end if;
  raise notice 'PASS: user A scoped to org A';
end $$;

\echo '== user A: can write within org A =='
do $$ begin
  insert into public.incidents (
    organization_id, store_id, title, status, severity
  ) values (
    'aaaaaaaa-1111-1111-1111-111111111111',
    (select id from public.store_connections where organization_id = 'aaaaaaaa-1111-1111-1111-111111111111' limit 1),
    'User A incident',
    'detected',
    'low'
  );
  insert into public.agent_findings (
    incident_id, agent_name, summary
  ) values (
    'aaaaaaaa-1111-1111-1111-111111111201', 'Returns Agent', 'RLS test finding'
  );
  raise notice 'PASS: user A wrote incidents / agent_findings in org A';
end $$;

\echo '== user A: cannot write to org B =='
do $$ begin
  begin
    insert into public.incidents (
      organization_id, store_id, title, status, severity
    ) values (
      'bbbbbbbb-2222-2222-2222-222222222222',
      (select id from public.store_connections where organization_id = 'bbbbbbbb-2222-2222-2222-222222222222' limit 1),
      'cross-tenant',
      'detected',
      'low'
    );
    raise exception 'FAIL: user A inserted incident into org B';
  exception when insufficient_privilege then
    raise notice 'PASS: user A insert into org B denied';
  end;
end $$;

\echo '== user A: contract tables read-only =='
do $$ begin
  begin
    insert into public.products (organization_id, store_id, external_id, title)
    values (
      'aaaaaaaa-1111-1111-1111-111111111111',
      (select id from public.store_connections where organization_id = 'aaaaaaaa-1111-1111-1111-111111111111' limit 1),
      'hack',
      'Hack'
    );
    raise exception 'FAIL: user A wrote to read-only products';
  exception when insufficient_privilege then
    raise notice 'PASS: user A insert into products denied (read-only)';
  end;
end $$;
reset role;

\echo '== user B: sees only org B data =='
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', false);
set role authenticated;
do $$ declare c int;
begin
  select count(*) into c from public.products;
  if c <> 1 then raise exception 'FAIL: user B read products = % (expected 1)', c; end if;
  if not exists (select 1 from public.products where external_id = 'prod_b') then
    raise exception 'FAIL: user B cannot see org B product';
  end if;
  if exists (select 1 from public.products where external_id = 'prod_a') then
    raise exception 'FAIL: user B can see org A product (cross-tenant leak)';
  end if;
  raise notice 'PASS: user B scoped to org B';
end $$;
reset role;

\echo '== user A: config tables write denied =='
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false);
set role authenticated;
do $$ begin
  begin
    insert into public.business_reports (organization_id, summary, narrative)
    values ('aaaaaaaa-1111-1111-1111-111111111111', '{}'::jsonb, 'hack');
    raise exception 'FAIL: user A inserted business_reports';
  exception when insufficient_privilege then
    raise notice 'PASS: user A insert into business_reports denied';
  end;
end $$;

\echo '== authenticated: reset_store_data denied =='
do $$ begin
  begin
    perform public.reset_store_data(
      (select id from public.store_connections where organization_id = 'aaaaaaaa-1111-1111-1111-111111111111' limit 1)
    );
    raise exception 'FAIL: authenticated called reset_store_data';
  exception when insufficient_privilege then
    raise notice 'PASS: reset_store_data denied for authenticated';
  end;
end $$;

\echo '== authenticated: store_connection_secrets denied =='
do $$ begin
  begin
    insert into public.store_connection_secrets (store_id, access_token, scopes)
    values (
      (select id from public.store_connections where organization_id = 'aaaaaaaa-1111-1111-1111-111111111111' limit 1),
      'secret-token',
      'read_products'
    );
    raise exception 'FAIL: authenticated inserted store_connection_secrets';
  exception when insufficient_privilege then
    raise notice 'PASS: authenticated insert into store_connection_secrets denied';
  end;

  begin
    perform 1
    from public.store_connection_secrets
    where store_id = (
      select id from public.store_connections where organization_id = 'aaaaaaaa-1111-1111-1111-111111111111' limit 1
    );
    raise exception 'FAIL: authenticated read store_connection_secrets';
  exception when insufficient_privilege then
    raise notice 'PASS: authenticated select from store_connection_secrets denied';
  end;
end $$;
reset role;

\echo 'ALL RLS CHECKS PASSED'
