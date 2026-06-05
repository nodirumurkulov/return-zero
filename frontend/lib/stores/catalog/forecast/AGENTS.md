# AGENTS.md — lib/stores/analytics/forecast

Deterministic time-series forecasts (no ML). **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Files

| File | Role |
|------|------|
| `types.ts` | `PointForecast`, `StockoutForecast` |
| `methods.ts` | `linearTrend`, `forecastAhead`, seasonality helpers |
| `predictors.ts`, `product.ts` | Product-level wiring |

## Best practices

- Deterministic forecasts only — no ML stubs or “placeholder” APIs left for compat; replace callers when signatures improve.

## Code style

- Same inputs → same outputs.
- No index `let` loops; use `const`, `reduce`, or `Array.from` batch slices.
