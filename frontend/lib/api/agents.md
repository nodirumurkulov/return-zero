# lib/api/

Cross-cutting HTTP helpers for route handlers (not domain business logic).

## Files

- `read-json.ts` — `readOptionalJson`, `readAdvanceDays`

Add `parse-json.ts` with Zod in RUN-73. **Never** use async IIFEs in routes — call these helpers or domain parsers instead.

## Anti-patterns

```typescript
// BAD
const x = await (async () => { ... })();

// GOOD
const x = await readAdvanceDays(req);
```
