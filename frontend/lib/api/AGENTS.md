# lib/api/

Cross-cutting HTTP helpers for route handlers (not domain business logic).

## Files

- `read-json.ts` — `parseJsonString`, `readOptionalJson`, `readAdvanceDays`
- `slack.ts` — `parseSlackInteractionPayload` for webhook form payloads

Add Zod parsers in RUN-73. **Never** use IIFEs in routes — call these helpers or domain parsers instead.

## Anti-patterns

```typescript
// BAD — sync IIFE
const payload = (() => { try { return JSON.parse(raw); } catch { return null; } })();

// BAD — async IIFE
const x = await (async () => { ... })();

// GOOD
const payload = parseSlackInteractionPayload(raw);
const x = await readAdvanceDays(req);
```
