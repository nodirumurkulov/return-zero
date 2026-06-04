# frontend/

Next.js 16 App Router app. Package manager: **Bun** (`bun.lock`). Lint: strict ESLint (`eslint.config.mjs`), `bun run lint` with `--max-warnings 0`.

## Commands

| Script | Purpose |
|--------|---------|
| `bun run dev` | Dev server |
| `bun run check` | lint + typecheck |
| `bun run build` | Production build |

## Layout

Each subdirectory has `README.md` + `AGENTS.md`.

- `app/` — routes and API ([README](app/README.md) · [AGENTS](app/AGENTS.md))
- `components/` — UI ([README](components/README.md) · [AGENTS](components/AGENTS.md))
- `lib/` — domain logic ([README](lib/README.md) · [AGENTS](lib/AGENTS.md))
- `proxy.ts` — Clerk auth middleware (Next 16 proxy)

## Conventions

See root [AGENTS.md](../AGENTS.md). Prefer **redesign over backward compatibility**. Never add `let` or async IIFEs. Import domain types from `lib/<domain>/` only — never re-export from components.
