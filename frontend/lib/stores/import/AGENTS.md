# AGENTS.md — lib/stores/import

Platform import loaders and `Import` domain. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `import.ts` | **`Import`** class — run, status, externalIdMap |
| `types.ts` | Types, Zod schemas |
| `errors.ts` | `ImportError` |
| `index.ts` | Barrel |
| `shopify.ts` | **`ShopifyImportLoader`** — REST sync via `@/lib/shopify/server` |

Internal only (not in barrel): `mock.ts`, `loaders/`, `shopify/` (pagination, schemas, mappers, phases).

Import via `@/lib/stores` (types/schemas) or `@/lib/stores/server` (`getStore().import.*`).
