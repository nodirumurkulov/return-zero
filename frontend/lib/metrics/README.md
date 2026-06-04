# Metrics domain

Config-driven KPI definitions, 30-day source facts, monthly series RPCs, and the metrics evaluation engine.

## What's here

| File | Purpose |
|------|---------|
| `types.ts` | `MetricDefinition`, `ProductSourceFacts`, `MonthlyPoint`, … |
| `engine.ts` | `computeProductMetrics` and breach evaluation |
| `series.ts` | Monthly series helpers |

Feeds **detection** and **forecast**; KPI rows come from `metric_definitions` in Postgres.

## Usage

```typescript
import { computeProductMetrics } from "@/lib/metrics/engine";
import type { MetricDefinition } from "@/lib/metrics/types";
```

## Notes

- KPIs are data-driven (DB rows), not hard-coded metric names in TypeScript.

**Agents:** [AGENTS.md](AGENTS.md)  
**Parent:** [../README.md](../README.md)  
**Last reviewed:** 2026-06-04
