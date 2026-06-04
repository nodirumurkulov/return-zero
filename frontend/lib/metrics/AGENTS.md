# AGENTS.md — lib/metrics

Config-driven KPI engine and monthly series. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Files

| File | Role |
|------|------|
| `types.ts` | `MetricDefinition`, `ProductSourceFacts`, `MonthlyPoint`, … |
| `engine.ts` | `computeProductMetrics`, breach evaluation |
| `series.ts` | Monthly series (paginated RPC) |
| `sources.ts` | Load source facts |

## Rules

- KPI definitions come from DB (`metric_definitions`), not hard-coded metric keys in routes.
- Changing RPC signatures requires updating `scripts/check-metrics.mjs` and consumers in `detection/`.
