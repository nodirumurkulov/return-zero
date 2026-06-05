-- =============================================================
-- rls_policies_test.sql  (RUN-34 / 008 / 015 / 018)
-- Asserts RLS policies for anon vs authenticated.
-- After migrations: `bun run db:reset` then `bun run db:test:rls`.
-- Any failed assertion RAISEs, aborting under `psql -v ON_ERROR_STOP=1`.
-- =============================================================

\echo '== anon: reads return 0 rows (RLS hides everything) =='
set role anon;
do $$ declare c int;
begin
  select count(*) into c from products;                if c <> 0 then raise exception 'FAIL: anon read products = %', c; end if;
  select count(*) into c from incidents;               if c <> 0 then raise exception 'FAIL: anon read incidents = %', c; end if;
  select count(*) into c from product_kpi_thresholds;  if c <> 0 then raise exception 'FAIL: anon read product_kpi_thresholds = %', c; end if;
  select count(*) into c from metric_definitions;      if c <> 0 then raise exception 'FAIL: anon read metric_definitions = %', c; end if;
  select count(*) into c from business_settings;        if c <> 0 then raise exception 'FAIL: anon read business_settings = %', c; end if;
  select count(*) into c from forecast_rules;           if c <> 0 then raise exception 'FAIL: anon read forecast_rules = %', c; end if;
  select count(*) into c from product_baselines;       if c <> 0 then raise exception 'FAIL: anon read product_baselines = %', c; end if;
  select count(*) into c from business_reports;         if c <> 0 then raise exception 'FAIL: anon read business_reports = %', c; end if;
  raise notice 'PASS: anon sees 0 rows on protected tables';
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
do $$ begin
  begin
    insert into metric_definitions(metric_key, display_name, numerator_source, numerator_field, default_threshold, direction)
    values ('anon_metric', 'Anon', 'sales', 'revenue', 1, 'above');
    raise exception 'FAIL: anon inserted into metric_definitions';
  exception when insufficient_privilege then raise notice 'PASS: anon insert into metric_definitions denied';
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
  select count(*) into c from metric_definitions;      if c < 1 then raise exception 'FAIL: authed read metric_definitions = %', c; end if;
  select count(*) into c from business_settings;        if c < 1 then raise exception 'FAIL: authed read business_settings = %', c; end if;
  select count(*) into c from forecast_rules;           if c < 1 then raise exception 'FAIL: authed read forecast_rules = %', c; end if;
  raise notice 'PASS: authenticated can read core and config tables';
end $$;

\echo '== authenticated: writes allowed on write tables =='
do $$ begin
  insert into incidents(title) values ('authed-incident');
  insert into agent_findings(incident_id, agent_name, summary)
    values ((select id from incidents limit 1), 'Returns Agent', 'test finding');
  insert into product_kpi_thresholds(product_id, metric_key, threshold)
  values ((select product_id from products limit 1), 'ad_roas', 2.0)
  on conflict (product_id, metric_key) do update set threshold = excluded.threshold;
  insert into incident_actions(incident_id, title, description)
    values ((select id from incidents limit 1), 'RLS test action', 'rls test action');
  insert into incident_timeline(incident_id, event_type, description)
    values ((select id from incidents limit 1), 'test', 'rls test timeline');
  insert into business_reports(summary) values ('{"test": true}'::jsonb);
  raise notice 'PASS: authenticated wrote incidents / agent_findings / product_kpi_thresholds / incident_actions / incident_timeline / business_reports';
end $$;

\echo '== authenticated: writes denied on read-only tables =='
do $$ begin
  begin
    insert into products(product_id) values ('authed-should-fail');
    raise exception 'FAIL: authenticated wrote to read-only products';
  exception when insufficient_privilege then raise notice 'PASS: authenticated insert into products denied (read-only)';
  end;
end $$;
do $$ begin
  begin
    insert into metric_definitions(metric_key, display_name, numerator_source, numerator_field, default_threshold, direction)
    values ('authed_metric', 'Authed', 'sales', 'revenue', 1, 'above');
    raise exception 'FAIL: authenticated wrote to read-only metric_definitions';
  exception when insufficient_privilege then raise notice 'PASS: authenticated insert into metric_definitions denied (read-only)';
  end;
end $$;
do $$ begin
  begin
    insert into business_settings(key, value) values ('authed_key', 1);
    raise exception 'FAIL: authenticated wrote to read-only business_settings';
  exception when insufficient_privilege then raise notice 'PASS: authenticated insert into business_settings denied (read-only)';
  end;
end $$;
do $$ begin
  begin
    insert into forecast_rules(rule_key, kind, threshold) values ('authed_rule', 'stockout', 1);
    raise exception 'FAIL: authenticated wrote to read-only forecast_rules';
  exception when insufficient_privilege then raise notice 'PASS: authenticated insert into forecast_rules denied (read-only)';
  end;
end $$;
reset role;

\echo 'ALL RLS CHECKS PASSED'
