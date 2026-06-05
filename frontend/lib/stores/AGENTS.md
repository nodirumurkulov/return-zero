# AGENTS.md — lib/stores

Ecommerce store product domain. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `index.ts` | `Store`, re-exports from `connect/` |
| `connect/` | `StoreConnector`, platform connectors, `connectStore` |
| `analytics/` | Replay time-travel, orders feed |
| `incidents/` | Detection and incident lifecycle |

## Rules

- Import from `@/lib/stores` only — not `@/lib/stores/connect`.
- `index.ts` wraps connectors with `Store` (`{ connector }`).
