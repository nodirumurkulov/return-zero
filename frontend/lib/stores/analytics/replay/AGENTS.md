# AGENTS.md — lib/stores/analytics/replay

Analytics time-travel: replay cursor + live orders feed. **Parent:** [../../../AGENTS.md](../../../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `replay.ts` | `runReplay`, `resetReplay` — advance cursor, delegate detection with `asOf` |
| `cursor.ts` | Read/write `store_connections.replay_cursor` |
| `replay-bounds.ts` | Stream window bounds (`dataEndDate`, `streamStartDate`, `REPLAY_START`) |
| `replay-request.ts` | `ReplayOpts`, `replayBodySchema` for `/api/replay` |
| `replay-result.ts` | `ReplayResult` |
| `feed/` | Orders stream query + `OrderFeedItem` types |

## Rules

- Replay owns cursor + feed only; detection stays in `@/lib/detection/*` until `stores/incidents` lands.
- Import from `@/lib/stores/analytics/replay`; do not import `lib/orders/` or `lib/detection/replay.ts`.
