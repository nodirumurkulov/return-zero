# AGENTS.md — components/catalog

Catalog UI. **Parent:** [../../../AGENTS.md](../../../AGENTS.md)

## Data flow

Server pages pass props from `@/lib/catalog` queries. `ThresholdEditor` calls server action `updateThreshold` in `app/actions.ts`.

## Types

`ProductMetric`, `KpiThreshold`, `HealthLevel`, `computeProductHealth` from `@/lib/catalog`.

## Rules

- No Supabase in components.
