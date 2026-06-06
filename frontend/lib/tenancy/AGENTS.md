# AGENTS.md — lib/tenancy

Organization membership, active store scope, bootstrap, and Slack routing. **Parent:** [../AGENTS.md](../AGENTS.md)

## Layout

| File | Role |
|------|------|
| `tenancy.ts` | **`Tenancy`** class — org resolution, store listing, active store |
| `types.ts` | `StoreScope`, `AppTenancy`, option + result types |
| `organization.ts`, `organization-member.ts` | DB row types |
| `create.ts` | `createOrganizationWithOwner` (sign-up bootstrap) |
| `slack.ts` | Slack team → org, delivery channel resolution |
| `admin.ts` | `listAllOrganizationIds`, `listAllStoreScopes` (cron / service role) |
| `constants.ts` | Demo org name/slug for seed + onboarding copy |
| `schemas.ts` | Zod for switch-store API |
| `errors.ts` | `TenancyError` |
| `server.ts` | `getTenancy`, cached scope helpers, server exports |
| `index.ts` | Types, schemas, constants — client-safe |

## Public API

```typescript
import {
  getTenancy,
  getAppTenancy,
  getStoreScope,
  tryGetStoreScope,
  listAllOrganizationIds,
  listAllStoreScopes,
  createOrganizationWithOwner,
  resolveOrganizationIdForSlackTeam,
} from "@/lib/tenancy/server";
import type { AppTenancy, StoreScope, Organization } from "@/lib/tenancy";
import { HUGO_MOCK_STORE_NAME } from "@/lib/tenancy";
```

## Rules

- **User routes:** `getStoreScope()` or `tryGetStoreScope(supabase)` — pass `scope` into store domains.
- **Cron:** `listAllStoreScopes(createAdminClient())` or org loop via `listAllOrganizationIds`.
- **Sign-up:** `createOrganizationWithOwner(createAdminClient(), …)` after `auth.signUp`.
- **Slack webhook:** `resolveOrganizationIdForSlackTeam` then `getTenancy().getStoreScope({ organizationId })`.
- MVP: first `organization_members` row; `organizations.active_store_id` selects active store.
