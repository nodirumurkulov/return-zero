# lib/metrics/

Config-driven KPI engine and monthly time series for detection/forecasting.

## Files

- `types.ts` — `MetricDefinition`, `MonthlyPoint`, engine types
- `engine.ts` — compute metrics from source facts
- `series.ts` — `getMonthlySeries` (paginated RPC)
- `sources.ts` — load source facts

`MonthlyPoint` lives in `types.ts`; `series.ts` re-exports it.
