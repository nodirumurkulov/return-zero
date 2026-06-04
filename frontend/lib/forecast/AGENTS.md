# lib/forecast/

Deterministic time-series methods (linear trend, EWMA, seasonality). No ML.

## Files

- `types.ts` — `PointForecast`, `StockoutForecast`
- `methods.ts` — `linearTrend`, `forecastAhead`, …
- `predictors.ts`, `product.ts` — product-level wiring

Use `reduce` / `const` only — no index `let` loops.
