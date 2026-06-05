# AGENTS.md — lib/onboarding

Onboarding connect flow client API. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| Path | Role |
|------|------|
| `api-schemas.ts` | Zod for `POST /api/onboarding/connect` responses |
| `api/` | Browser `fetch` functions |
| `hooks/` | TanStack Query wrappers around `api/` |

## Rules

- Hooks must not call `fetch` directly — go through `api/`.
- Store loading logic lives in `@/lib/stores`, not here.
- Demo data is provisioned at signup via `connectStore(..., "mock_csv")` in `createOrganizationWithOwner`.
- Onboarding shows an integration grid (Pretty Fly + Shopify coming soon); no CSV upload.
