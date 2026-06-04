# AGENTS.md — lib/forecast

Deterministic time-series forecasts (no ML). **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Files

| File | Role |
|------|------|
| `types.ts` | `PointForecast`, `StockoutForecast` |
| `methods.ts` | `linearTrend`, `forecastAhead`, seasonality helpers |
| `predictors.ts`, `product.ts` | Product-level wiring |

## Code style

- Same inputs → same outputs.
- No index `let` loops; use `const`, `reduce`, `chunkArray` patterns from repo conventions.
