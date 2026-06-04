# Analytics & Forecasting — query patterns (RUN-14)

How the UI, the agents, and the detectors read the data. **Use these patterns
everywhere** so the frontend and the AI agents reason from the *same* numbers and
the *same* config.

Principle: **deterministic math computes the numbers; the LLM only narrates.** KPIs
and thresholds are **configuration** (`metric_definitions`, `product_kpi_thresholds`,
`forecast_rules`, `business_settings`) — never hardcoded.

---

## 1. The source layer (SQL functions, KPI-neutral)

Generic, per-product facts derived from the contract schema. No business KPI lives
here — just "what the data says."

| Function | Returns | Used by |
|---|---|---|
| `product_source_facts(window_days)` | per-product `sales_revenue, sales_units, refunds_amount, refunds_count, ads_spend, ads_revenue, support_count` over a rolling window | metrics engine |
| `product_monthly_series(months)` | per-product monthly `units, revenue, refund_amount, refund_count, ad_spend, ad_revenue` (zero-filled spine) | sparklines, forecasting |
| `product_daily_outflow(days, as_of)` | per-product recent inventory burn rate + current stock (as-of cursor) | stockout forecasting |

```ts
const { data } = await supabase.rpc("product_source_facts", { p_window_days: 30 });
// NB: PostgREST caps RPC results at 1000 rows. product_monthly_series is ~1488 rows —
// page it: .rpc(...).range(from, from + 999) in a loop (see lib/metrics/series.ts).
```

## 2. The metrics engine (config-driven KPIs) — `frontend/lib/metrics`

A KPI = `operation(numerator_source.field [, denominator_source.field])` defined as a
row in `metric_definitions`. Add/tune a KPI by editing data, not code.

```ts
import { computeMetrics, computeProductMetrics } from "@/lib/metrics/engine";

// All products → { [product_id]: MetricValue[] } (status: healthy|warning|critical)
const all = await computeMetrics(supabase);

// One product (agents)
const metrics = await computeProductMetrics(supabase, productId);
// MetricValue: { metric_key, value, threshold, direction, status, unit, severity }
```

Per-product threshold overrides live in `product_kpi_thresholds`; the global default
is on the definition.

## 3. Forecasting — `frontend/lib/forecast`

Deterministic, explainable predictors over the monthly series + burn rate.

```ts
import { getProductSeries } from "@/lib/metrics/series";
import { forecastForProduct } from "@/lib/forecast/product";

const series = await getProductSeries(supabase, productId, 24);
const fc = forecastForProduct(series, currentUnits, dailyOutflow, leadDays, bufferDays);
// fc.stockout / fc.refund_rate / fc.roas / fc.revenue → { point, lower, upper, method, ... }
```

## 4. Detection endpoints (deterministic; open incidents)

| Endpoint | Does |
|---|---|
| `POST /api/detect` | reactive: breach detection → opens incidents (severity via `lib/detection/severity.ts`) |
| `POST /api/forecast` | predictive: forecast rules → forward-looking incidents |
| `POST /api/recover` | advances projected recovery for monitoring incidents → auto-resolve (`{ advance_days }`) |
| `POST /api/investigate` | LLM agents narrate an existing incident (5 agents → root cause + actions) |

## 5. UI reads (server components)

```ts
// catalog cards / detail — see frontend/app/catalog
const metrics = await computeMetrics(supabase);             // health + KPIs
const series  = await getProductSeries(supabase, id, 24);   // sparklines
```

> **Known divergence to converge:** some UI pages currently read SQL views
> (`product_metrics_view`, `product_metrics_monthly_view`) created in parallel work,
> while the engine/agents use `computeMetrics` + the functions above. They agree
> numerically; the canonical pattern going forward is the engine (`lib/metrics`),
> so the views should be retired or made thin wrappers over `product_source_facts`.

## 6. Data validation

`frontend/scripts/validate-counts.ts` asserts imported row counts match `data/README.md`
(run manually after seeding; see script header for env vars).
