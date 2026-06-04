-- =============================================================
-- 012_learn.sql  (RUN-80 / RUN-81 — BYOD Phase 2: model analysis)
--
-- After a client uploads their own data (Phase 1), the agent learns what is
-- "normal for this store" and writes it down as a knowledge base:
--
--   * product_baselines — per-product, per-KPI mean/stddev over the client's own
--     monthly history. The basis for the derived product_kpi_thresholds (engine
--     shape, migration 003) so detection fires on deviation from the client's
--     baseline, not seeded defaults.
--   * business_reports — the persisted "here's your business + the patterns we
--     noticed" report shown right after upload (deterministic stats in `summary`,
--     the LLM narrative in `narrative`).
-- =============================================================

create table if not exists product_baselines (
  product_id   text not null references products(product_id),
  metric_key   text not null references metric_definitions(metric_key),
  mean         numeric not null,
  stddev       numeric not null,
  sample_n     integer not null,
  computed_at  timestamptz not null default now(),
  primary key (product_id, metric_key)
);

create index if not exists idx_product_baselines_lookup
  on product_baselines (product_id, metric_key);

create table if not exists business_reports (
  id          uuid primary key default gen_random_uuid(),
  summary     jsonb not null,
  narrative   text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_business_reports_created
  on business_reports (created_at desc);
