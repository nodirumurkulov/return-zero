# AGENTS.md — lib/stores/analytics/replay

Analytics time-travel: replay cursor + live orders feed. **Parent:** [../../../AGENTS.md](../../../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `replay.ts` | **`Replay`** — sole public API (`run`, `reset`, `listIncomingOrders`, bounds) |
| `cursor.ts`, `replay-bounds.ts` | Internal cursor/bounds helpers |
| `replay-request.ts` | `ReplayOpts`, `replayBodySchema` for `/api/replay` |
| `replay-result.ts` | `ReplayResult` |
| `feed/` | `ordersQuerySchema`, `OrderFeedItem` types |

## Public API

All operations are methods on `Replay`. Instantiate via `createReplay(supabase)`:

```typescript
const replay = createReplay(supabase);
await replay.run({ organizationId, advanceDays });
await replay.listIncomingOrders({ organizationId, after, limit });
```

`Replay.REPLAY_START` is the fallback when uploaded data has no orders.

## Rules

- Replay owns cursor + feed only; detection delegates to `createIncidents(supabase).detectBreaches` with `asOf`.
- Import from `@/lib/stores/analytics/replay`; do not import legacy `lib/orders/` or `lib/detection/`.
