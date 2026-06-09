# RLS Penetration Test Audit

Row-Level Security (RLS) audit covering all tables in the return-zero database.

## What is RLS?

Row-Level Security is Postgres's built-in mechanism to restrict which rows a query can access, based on the authenticated user's identity. In Supabase, every query through the client uses the `anon` or `authenticated` role, and RLS policies determine what data each user can see and modify.

**Without RLS**: any authenticated user could `SELECT * FROM incidents` and see every organization's incidents.  
**With RLS**: `SELECT * FROM incidents` only returns rows where `organization_id IN (user_organization_ids())`.

## RLS architecture

### The `user_organization_ids()` function

```sql
-- private schema, security definer (runs as postgres)
CREATE FUNCTION private.user_organization_ids()
RETURNS SETOF uuid AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = (SELECT auth.uid());
$$;
```

This is the core of tenant isolation. Every org-scoped policy uses this function to filter rows to only the current user's organizations.

### Policy types

| Type | SQL | Tables |
|------|-----|--------|
| **Read-only** | `FOR SELECT ... USING (org_id IN user_organization_ids())` | Contract tables (products, orders, customers, etc.), config tables (metric_definitions, store_connections) |
| **Read-write** | `FOR ALL ... USING (...) WITH CHECK (...)` | App tables (incidents, agent_findings, incident_actions, investigation_steps, business_profile) |
| **No policies (service-role only)** | RLS enabled but no policies granted | waitlist_signups, waitlist_pricing_messages, waitlist_pricing_state |
| **Revoked (service-role only)** | `REVOKE ALL FROM anon, authenticated` | store_connection_secrets |

## Test coverage

### Original tests (Phase 0)

| Test | What it proves |
|------|---------------|
| Anon reads return 0 rows | Unauthenticated users see nothing on products, incidents, thresholds |
| Anon writes denied | `INSERT INTO incidents` raises `insufficient_privilege` for anon |
| User A sees only org A | Products, incidents, thresholds filtered to user's org |
| User A can write org A | Insert into incidents + agent_findings succeeds within own org |
| User A cannot write org B | Insert into org B incidents raises `insufficient_privilege` |
| Contract tables read-only | Authenticated user cannot INSERT into products |
| Config tables read-only | Authenticated user cannot INSERT into business_reports |
| `reset_store_data` denied | Authenticated users cannot call admin-only function |
| `store_connection_secrets` denied | Read and write denied for authenticated role |

### Extended tests (Phase 3B)

| Test | What it proves |
|------|---------------|
| `incident_actions` org-scoped | User A sees only org A actions; insert into org B denied |
| `incident_timeline` org-scoped | User A sees only org A timeline events; org B filtered out |
| `investigation_steps` org-scoped | User A sees only org A steps; insert into org B denied |
| `business_profile` org-scoped | User A sees only org A profile; update org B = 0 rows affected |
| `product_cost_overrides` org-scoped | User A sees only org A overrides; org B filtered out |
| `waitlist_signups` denied | Both anon and authenticated see 0 rows; insert denied |
| `waitlist_pricing_messages` denied | Authenticated sees 0 rows (no policies, service-role only) |
| `waitlist_pricing_state` denied | Authenticated sees 0 rows (no policies, service-role only) |
| User B cross-check | User B sees no org A data on any extended table |
| `organization_members` self-only | User A sees only their own membership; user B's membership hidden |

## Attack scenarios tested

### 1. Cross-tenant data read (STRIDE: I3)
**Attack**: User in org A queries `incidents` with no WHERE clause.  
**Result**: RLS silently filters — only org A rows returned.  
**Verified by**: User A/B isolation tests on every org-scoped table.

### 2. Cross-tenant data write (STRIDE: E1)
**Attack**: User in org A inserts an incident with `organization_id = org_b`.  
**Result**: `insufficient_privilege` — `WITH CHECK` clause blocks the insert.  
**Verified by**: Cross-org insert tests on incidents, incident_actions, investigation_steps.

### 3. Privilege escalation via contract tables
**Attack**: Authenticated user tries to INSERT into read-only tables (products, business_reports).  
**Result**: `insufficient_privilege` — only SELECT policies exist.  
**Verified by**: Contract and config table write-denial tests.

### 4. Secrets exfiltration
**Attack**: Authenticated user queries `store_connection_secrets` (Shopify tokens).  
**Result**: `insufficient_privilege` — table access revoked for anon + authenticated.  
**Verified by**: Read and write denial tests on store_connection_secrets.

### 5. Waitlist data access
**Attack**: Authenticated user queries waitlist_signups to harvest emails.  
**Result**: 0 rows — RLS enabled with no policies means deny-all for non-service-role.  
**Verified by**: Anon and authenticated denial tests on waitlist tables.

## Running the tests

```bash
# Requires local Supabase running
cd frontend
bun run db:reset        # apply all migrations
bun run db:test:rls     # runs rls_policies_test.sql
```

All tests use `RAISE EXCEPTION` on failure, so any broken policy will abort the script immediately with a clear error message.

## Known gaps

1. **No DELETE isolation tests** — we test SELECT and INSERT cross-tenant, but not DELETE. Users could theoretically delete their own org's data (which is by design for app tables), but DELETE on read-only tables should be tested.
2. **No UPDATE-to-different-org test** — a user updating a row's `organization_id` to another org should be blocked by `WITH CHECK`. Not explicitly tested.
3. **No concurrent session tests** — tests run sequentially; real-world concurrent access patterns not covered.
