-- =============================================================
-- rls_policies_test.sql  (RUN-34)
-- Asserts the 003 RLS policies behave correctly for anon vs authenticated.
-- After migrations: `bun run db:reset` then `bun run db:test:rls` (Supabase CLI, local).
-- Any failed assertion RAISEs, aborting under `psql -v ON_ERROR_STOP=1`.
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
    insert into incidents(title) values ('anon-should-fail');
    raise exception 'FAIL: anon inserted into incidents';
  exception when insufficient_privilege then raise notice 'PASS: anon insert into incidents denied';
  end;
end $$;
do $$ begin
  begin
    insert into product_kpi_thresholds(metric_key, threshold) values ('return_rate', 1);
    raise exception 'FAIL: anon inserted into product_kpi_thresholds';
  exception when insufficient_privilege then raise notice 'PASS: anon insert into product_kpi_thresholds denied';
  end;
end $$;
reset role;

\echo '== authenticated: reads are allowed =='
set role authenticated;
do $$ declare c int;
begin
  select count(*) into c from products;                if c < 1 then raise exception 'FAIL: authed read products = %', c; end if;
  select count(*) into c from incidents;               if c < 1 then raise exception 'FAIL: authed read incidents = %', c; end if;
  select count(*) into c from product_kpi_thresholds;  if c < 1 then raise exception 'FAIL: authed read product_kpi_thresholds = %', c; end if;
  raise notice 'PASS: authenticated can read products / incidents / product_kpi_thresholds';
end $$;

\echo '== authenticated: writes allowed on write tables =='
do $$ begin
  insert into incidents(title) values ('authed-incident');
  insert into agent_findings(incident_id, agent_name, summary)
    values ((select id from incidents limit 1), 'Returns Agent', 'test finding');
  insert into product_kpi_thresholds(product_id, metric_key, threshold) values ('P1', 'ad_roas', 2.0);
  raise notice 'PASS: authenticated wrote incidents / agent_findings / product_kpi_thresholds';
end $$;

\echo '== authenticated: writes denied on read-only mock tables =='
do $$ begin
  begin
    insert into products(product_id) values ('authed-should-fail');
    raise exception 'FAIL: authenticated wrote to read-only products';
  exception when insufficient_privilege then raise notice 'PASS: authenticated insert into products denied (read-only)';
  end;
end $$;
reset role;

\echo 'ALL RLS CHECKS PASSED'
