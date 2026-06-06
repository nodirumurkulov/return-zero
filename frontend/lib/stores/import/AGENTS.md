# AGENTS.md — lib/stores/import

Platform import loaders and `Import` domain. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `import.ts` | **`Import`** class — run, status, externalIdMap |
| `types.ts` | Types, Zod schemas |
| `errors.ts` | `ImportError` |
| `index.ts` | Barrel |

Internal only (not in barrel): `mock.ts`, `shopify.ts`, `loaders/`.

`shopify.ts` uses `@/lib/shopify/server` (`createShopifyAdminClient`, `readStoreSecret`) in RUN-126.

Import via `@/lib/stores` (types/schemas) or `@/lib/stores/server` (`getStore().import.*`).
