# Rate Limiting

Per-IP rate limiting on public and cost-sensitive endpoints, implemented in `frontend/lib/rate-limit.ts`.

## Why rate limit?

Public endpoints accept requests without authentication. Without rate limiting:

- **Brute-force** — an attacker tries thousands of passwords against sign-in
- **Spam** — bots flood the waitlist with garbage emails
- **Cost abuse** — automated requests to LLM-backed endpoints (pricing chat) rack up API bills
- **DoS** — exhaust serverless function concurrency, degrading service for real users

## Architecture

### Sliding window counter

Each limiter maintains a counter per IP address within a time window (default: 60 seconds). When the counter exceeds the configured limit, the request receives a `429 Too Many Requests` response with a `Retry-After` header.

```
Request from 1.2.3.4 → /api/waitlist
  → rateLimiters.waitlist.check("1.2.3.4")
  → count=3, limit=5 → allowed (remaining: 2)

Request from 1.2.3.4 → /api/waitlist (6th time in 60s)
  → count=6, limit=5 → 429 Too Many Requests
  → Retry-After: 42
```

### Current limits

| Endpoint | Limiter | Limit | Window |
|----------|---------|-------|--------|
| `POST /api/waitlist` | `waitlist` | 5 req | 60s |
| `POST /api/waitlist/pricing/chat` | `pricingChat` | 10 req | 60s |
| Auth pages | `auth` | 10 req | 60s |
| General API | `api` | 60 req | 60s |

### IP extraction

Client IP is read from `X-Forwarded-For` (first entry) or `X-Real-IP`, which Vercel and most reverse proxies set automatically.

## Current store: in-memory

The `MemoryStore` uses a `Map<string, WindowEntry>` with periodic cleanup. This works for:

- Local development (`bun run dev`)
- Single-instance deployments

**Limitation**: Vercel serverless functions may run on different instances, so each instance has its own counter. Rate limiting is still effective (each instance enforces limits), but the effective limit is `limit × instances`.

## Production upgrade: Upstash Redis

For strict per-IP enforcement across all serverless instances, swap `MemoryStore` for Upstash Redis:

```bash
bun add @upstash/ratelimit @upstash/redis
```

The `RateLimiter` interface stays the same — only the store backend changes. Upstash's sliding window algorithm provides the same semantics with shared state.

## Response format

Rate-limited responses include:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 42
X-RateLimit-Remaining: 0
Content-Type: application/json

{"error": "Too many requests. Please try again later."}
```

## Adding rate limiting to a new endpoint

```typescript
import { rateLimiters } from "@/lib/rate-limit";
import { checkRateLimit } from "@/lib/rate-limit-response";

export async function POST(req: Request) {
  const blocked = checkRateLimit(req, rateLimiters.waitlist);
  if (blocked) return blocked.response;
  // ... rest of handler
}
```
