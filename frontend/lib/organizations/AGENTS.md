# AGENTS.md — lib/organizations

Multi-tenant organization context. **Parent:** [../../AGENTS.md](../../AGENTS.md)

## Files

| File | Role |
|------|------|
| `organization.ts`, `organization-member.ts` | DB row types |
| `create.ts` | `createOrganizationWithOwner` (sign-up bootstrap) |
| `queries.ts` | `getCurrentOrganizationId`, `requireOrganizationId`, `tryRequireOrganizationId` |
| `demo-shops.ts` | Demo shop list for shell UI |

## Rules

- User-facing routes resolve org via `tryRequireOrganizationId(await createClient())` (or `requireOrganizationId` when throwing is fine in RSC).
- Cron/seed use `listAllOrganizationIds(createAdminClient())` to iterate tenants.
- MVP: one org per user at signup; no org-switcher yet.
