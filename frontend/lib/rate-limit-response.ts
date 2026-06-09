import { NextResponse } from "next/server";
import type { RateLimiter, RateLimitResult } from "./rate-limit";
import { getClientIp } from "./rate-limit";

/**
 * Check rate limit for a request. Returns a 429 response if exceeded, or null
 * if the request is allowed (caller should continue processing).
 *
 * Attaches standard rate-limit headers to the 429 response:
 *   - Retry-After: seconds until the client can retry
 *   - X-RateLimit-Limit: max requests per window (informational)
 *   - X-RateLimit-Remaining: requests left in current window
 */
export function checkRateLimit(
  req: Request,
  limiter: RateLimiter,
): { response: NextResponse; result: RateLimitResult } | null {
  const ip = getClientIp(req.headers);
  const result = limiter.check(ip);
  if (result.allowed) return null;
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  const response = NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
  return { response, result };
}
