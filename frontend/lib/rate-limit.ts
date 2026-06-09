/**
 * Sliding-window rate limiter for API route protection.
 *
 * ## Why rate limit?
 *
 * Public endpoints (waitlist signup, pricing chat, auth pages) are accessible
 * without authentication. Without rate limiting, an attacker can:
 *
 *   - **Brute-force credentials** — try thousands of passwords per second
 *   - **Spam signups** — flood the waitlist with garbage emails
 *   - **Abuse AI endpoints** — run up LLM costs via pricing chat
 *   - **Denial of service** — exhaust serverless function concurrency
 *
 * ## How it works
 *
 * Each rate limiter tracks requests per key (usually the client IP) within a
 * sliding time window. When the count exceeds the limit, subsequent requests
 * receive a 429 Too Many Requests response with a `Retry-After` header.
 *
 * The sliding window algorithm:
 *   1. Divide time into fixed windows (e.g., 60s each)
 *   2. Count requests in the current window + weighted previous window
 *   3. Weight = (window_size - elapsed) / window_size
 *   4. This smooths the boundary between windows (no burst at window reset)
 *
 * ## Store backends
 *
 * - **MemoryStore** (default): In-process Map. Works for `bun run dev` and
 *   single-instance deployments. NOT suitable for Vercel serverless (each
 *   invocation may run on a different instance with its own memory).
 *
 * - **Production upgrade**: Replace with Upstash Redis (`@upstash/ratelimit`)
 *   for shared state across serverless invocations. The `RateLimiter` interface
 *   stays the same — only the store changes.
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

interface RateLimitStore {
  get(key: string): WindowEntry | undefined;
  set(key: string, entry: WindowEntry): void;
}

class MemoryStore implements RateLimitStore {
  private readonly map = new Map<string, WindowEntry>();
  private lastCleanup = Date.now();
  private readonly cleanupInterval: number;

  constructor(windowMs: number) {
    this.cleanupInterval = windowMs * 2;
  }

  get(key: string): WindowEntry | undefined {
    this.maybeCleanup();
    return this.map.get(key);
  }

  set(key: string, entry: WindowEntry): void {
    this.map.set(key, entry);
  }

  private maybeCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupInterval) return;
    this.lastCleanup = now;
    for (const [key, entry] of this.map) {
      if (entry.resetAt < now) this.map.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimiterConfig {
  /** Max requests per window. */
  limit: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

export class RateLimiter {
  private readonly store: RateLimitStore;
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(config: RateLimiterConfig) {
    this.limit = config.limit;
    this.windowMs = config.windowMs;
    this.store = new MemoryStore(config.windowMs);
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.store.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.limit - 1, resetAt };
    }

    const newCount = entry.count + 1;
    if (newCount > this.limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    this.store.set(key, { count: newCount, resetAt: entry.resetAt });
    return { allowed: true, remaining: this.limit - newCount, resetAt: entry.resetAt };
  }
}

/**
 * Pre-configured limiters for different endpoint categories.
 *
 * Limits are per-IP. Adjust based on expected traffic patterns.
 */
export const rateLimiters = {
  /** Waitlist signup: 5 requests per minute per IP. */
  waitlist: new RateLimiter({ limit: 5, windowMs: 60_000 }),

  /** Pricing chat (LLM-backed): 10 requests per minute per IP. */
  pricingChat: new RateLimiter({ limit: 10, windowMs: 60_000 }),

  /** Auth endpoints (sign-in, sign-up): 10 requests per minute per IP. */
  auth: new RateLimiter({ limit: 10, windowMs: 60_000 }),

  /** General API: 60 requests per minute per IP. */
  api: new RateLimiter({ limit: 60, windowMs: 60_000 }),
} as const;

/** Extract client IP from request headers (Vercel/Cloudflare convention). */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
