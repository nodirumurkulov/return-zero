# AGENTS.md — components/catalog

Catalog UI. **Parent:** [../../../AGENTS.md](../../../AGENTS.md)

## Data flow

Server pages pass props from `@/lib/stores/analytics/catalog` queries. `ThresholdEditor` uses `useUpdateThreshold` from `@/hooks/stores/analytics/catalog` (`PATCH /api/catalog/[productId]/threshold`).

## Types

`ProductMetric`, `KpiThreshold`, `HealthLevel`, `computeProductHealth` from `@/lib/stores/analytics/catalog`.

## Best practices

- Props-only data — refactor toward server-passed catalog types; no optional “legacy” prop shapes.

## Rules

- No Supabase in components.
