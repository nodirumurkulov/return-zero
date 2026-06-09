# Security Audit Logging

Append-only event log for security-relevant operations. Addresses threat-model recommendations R1 (detection pipeline) and R2 (audit trail).

## Architecture

```
Route handler / server action
  │
  ├─ void logSecurityEvent(adminClient, { ... })
  │    └─ INSERT INTO security_events (best-effort, never throws)
  │
  └─ returns response (not blocked by audit)
```

`logSecurityEvent` is fire-and-forget (`void`): it uses `console.error` on failure instead of throwing, so a broken audit pipeline never disrupts user requests.

## Table schema

```sql
-- migration 025_security_events.sql
create table public.security_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id         uuid,
  category        security_event_category not null,
  action          text not null,
  severity        metric_severity not null default 'low',
  ip_address      text,
  user_agent      text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
```

**RLS**: Enabled + forced with no policies. Only `service_role` can read/write. Authenticated users and anon have zero access — audit logs cannot be tampered with by end users.

**Indexes**: `(organization_id, created_at DESC)`, `(category, created_at DESC)`, `(user_id, created_at DESC)`.

## Event categories

| Category | Description | Example actions |
|----------|-------------|-----------------|
| `auth` | Authentication events | `sign_in_success`, `sign_in_failure`, `sign_out`, `shopify_oauth_success`, `shopify_oauth_failure` |
| `privilege` | Privilege changes | `incident_actions_approved` |
| `config_change` | Configuration mutations | `threshold_updated` |
| `api_abuse` | Rate limits, suspicious patterns | `rate_limit_exceeded` (future) |
| `data_access` | Sensitive data reads | Reserved for future use |

## Severity levels

Uses the existing `metric_severity` enum:

| Level | Use |
|-------|-----|
| `low` | Routine operations (successful login, logout) |
| `medium` | Potentially security-relevant (failed login, threshold change, action approval) |
| `high` | Security incidents (OAuth failure, HMAC mismatch, repeated auth failures) |
| `critical` | Active attacks (reserved for detection rules) |

## Instrumented routes

| Route / action | Event | Category | Severity |
|----------------|-------|----------|----------|
| `signIn` (success) | `sign_in_success` | auth | low |
| `signIn` (failure) | `sign_in_failure` | auth | medium |
| `signOut` | `sign_out` | auth | low |
| `GET /api/shopify/callback` (success) | `shopify_oauth_success` | auth | low |
| `GET /api/shopify/callback` (failure) | `shopify_oauth_failure` | auth | high |
| `POST /api/stores/incidents/[id]/approve` | `incident_actions_approved` | privilege | medium |
| `PATCH /api/stores/catalog/[productId]/threshold` | `threshold_updated` | config_change | medium |

## Usage

```typescript
import { getRequestIp, logSecurityEvent } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";

// In a route handler (has access to Request for IP/UA):
void logSecurityEvent(createAdminClient(), {
  organization_id: scope.organizationId,
  user_id: user.id,
  category: "privilege",
  action: "incident_actions_approved",
  severity: "medium",
  ip_address: getRequestIp(req),
  user_agent: req.headers.get("user-agent"),
  metadata: { incident_id: "...", action_ids: [...] },
});

// In a server action (no Request object):
void logSecurityEvent(createAdminClient(), {
  user_id: user?.id,
  category: "auth",
  action: "sign_in_success",
  severity: "low",
  metadata: { email: "user@example.com" },
});
```

## Querying events

Events are service-role only. Query via admin client or direct SQL:

```sql
-- Failed logins in the last 24 hours
SELECT * FROM security_events
WHERE category = 'auth'
  AND action = 'sign_in_failure'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- All privilege changes for an org
SELECT * FROM security_events
WHERE organization_id = '<org-id>'
  AND category = 'privilege'
ORDER BY created_at DESC;

-- Brute-force detection: >5 failures from same IP in 10 minutes
SELECT ip_address, count(*) AS attempts
FROM security_events
WHERE action = 'sign_in_failure'
  AND created_at > now() - interval '10 minutes'
GROUP BY ip_address
HAVING count(*) > 5;
```

## Future work

1. **Phase 4B**: Anomaly detection rules — brute-force, impossible travel, privilege escalation patterns
2. **Rate limit integration**: Log `rate_limit_exceeded` events from the rate limiter (Phase 1C)
3. **Retention policy**: Add `pg_cron` job to archive events older than 90 days
4. **Dashboard**: Build admin UI for searching/filtering security events
5. **Alerting**: Slack notifications for high/critical severity events
