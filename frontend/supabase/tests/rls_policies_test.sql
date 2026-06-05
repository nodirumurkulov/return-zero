-- =============================================================
-- rls_policies_test.sql  (RUN-34 + per-user tenancy)
-- Asserts scoped data is hidden across tenants for authenticated.
-- =============================================================

\echo '== anon: reads return 0 rows (RLS hides everything) =='
set role anon;
do $$ declare c int;
begin
  select count(*) into c from products;                if c <> 0 then raise exception 'FAIL: anon read products = %', c; end if;
  select count(*) into c from incidents;               if c <> 0 then raise exception 'FAIL: anon read incidents = %', c; end if;
  select count(*) into c from product_kpi_thresholds;  if c <> 0 then raise exception 'FAIL: anon read product_kpi_thresholds = %', c; end if;
  raise notice 'PASS: anon sees 0 rows on products / incidents / product_kpi_thresholds';
end $$;

\echo '== anon: writes are denied =='
do $$ begin
  begin
    insert into incidents(owner_user_id, title) values (gen_random_uuid(), 'anon-should-fail');
    raise exception 'FAIL: anon inserted into incidents';
  exception when insufficient_privilege then raise notice 'PASS: anon insert into incidents denied';
  end;
end $$;
reset role;

\echo '== authenticated: reads only own rows when JWT uid is set =='
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}', true);

do $$ declare c int;
begin
  select count(*) into c from products;
  if c <> 0 then raise exception 'FAIL: authed tenant A read products = % (expected 0)', c; end if;
  raise notice 'PASS: tenant A sees 0 products before insert';
end $$;

insert into products (owner_user_id, product_id, title)
values ('00000000-0000-0000-0000-0000000000aa', 'rls_prod_a', 'Tenant A Product');

do $$ declare c int;
begin
  select count(*) into c from products;
  if c <> 1 then raise exception 'FAIL: authed tenant A read products = %', c; end if;
  raise notice 'PASS: tenant A sees own product';
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000bb","role":"authenticated"}', true);

do $$ declare c int;
begin
  select count(*) into c from products;
  if c <> 0 then raise exception 'FAIL: authed tenant B read tenant A products = %', c; end if;
  raise notice 'PASS: tenant B cannot see tenant A products';
end $$;

\echo '== authenticated: writes denied for another tenant =='
do $$ begin
  begin
    insert into products(owner_user_id, product_id, title)
    values ('00000000-0000-0000-0000-0000000000aa', 'rls_prod_b', 'Cross-tenant write');
    raise exception 'FAIL: tenant B wrote to tenant A products';
  exception when insufficient_privilege then raise notice 'PASS: cross-tenant insert denied';
  end;
end $$;

delete from products where owner_user_id = '00000000-0000-0000-0000-0000000000aa';
reset role;

\echo 'ALL RLS CHECKS PASSED'
