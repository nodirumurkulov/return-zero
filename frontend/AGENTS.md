# frontend/

Next.js 16 App Router app. Package manager: **Bun** (`bun.lock`). Lint: strict ESLint (`eslint.config.mjs`), `bun run lint` with `--max-warnings 0`.

## Commands

| Script | Purpose |
|--------|---------|
| `bun run dev` | Dev server |
| `bun run check` | lint + typecheck |
| `bun run build` | Production build |

## Layout

- `app/` — routes and API handlers ([AGENTS.md](app/AGENTS.md))
- `components/` — UI ([AGENTS.md](components/AGENTS.md))
- `lib/` — domain logic ([AGENTS.md](lib/AGENTS.md))
- `proxy.ts` — Clerk auth middleware (Next 16 proxy)

## Conventions

See root [AGENTS.md](../AGENTS.md). Never add `let` or async IIFEs. Import domain types from `lib/<domain>/`, not from components.
