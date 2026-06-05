# AGENTS.md — lib/stores/import

Platform import loaders and `Import` domain. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `import.ts` | `Import` class — `run`, `status`, `externalIdMap` |
| `mock.ts` | `MockImportLoader` (Pretty Fly CSV) |
| `shopify.ts` | `ShopifyImportLoader` (stub) |
| `loaders/` | CSV loader utilities |
| `schemas.ts` | Import API Zod schemas |

Import via `@/lib/stores` (types/schemas) or `@/lib/stores/server` (`getStore().import.*`).
