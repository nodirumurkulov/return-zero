# frontend/

Next.js 16 App Router app. Package manager: **Bun** (`bun.lock`). Lint: strict ESLint (`eslint.config.mjs`), `bun run lint` with `--max-warnings 0`.

## Commands

| Script | Purpose |
|--------|---------|
| `bun run dev` | Dev server |
| `bun run check` | lint + typecheck |
| `bun run build` | Production build |

## Layout

- `app/` — routes and API handlers ([agents.md](app/agents.md))
- `components/` — UI ([agents.md](components/agents.md))
- `lib/` — domain logic ([agents.md](lib/agents.md))
- `proxy.ts` — Clerk auth middleware (Next 16 proxy)

## Conventions

See root [agents.md](../agents.md). Never add `let` or async IIFEs. Import domain types from `lib/<domain>/`, not from components.
