import type { NextRequest } from "next/server";

/**
 * CSRF (Cross-Site Request Forgery) protection via Origin header verification.
 *
 * ## The attack
 *
 * A malicious site hosts a form that POSTs to our API:
 *
 *   <form action="https://hugo-app.vercel.app/api/stores/incidents/123/approve"
 *         method="POST">
 *     <input type="hidden" name="action_ids" value='["malicious-id"]' />
 *   </form>
 *   <script>document.forms[0].submit()</script>
 *
 * Because the user's browser has a valid Supabase session cookie, the request
 * is authenticated — but the user never intended to send it. The attacker
 * cannot read the response (same-origin policy), but the mutation is done.
 *
 * ## The defense
 *
 * Modern browsers attach an `Origin` header to every cross-origin request
 * (and to same-origin POST/PUT/PATCH/DELETE). We verify that the Origin
 * matches our own app URL. If it doesn't, the request is a cross-site
 * forgery and we reject it with 403.
 *
 * Fallback: if `Origin` is missing (rare — some privacy proxies strip it),
 * we check the `Referer` header's origin instead. If neither header is
 * present AND the request is a mutating method, we reject it — an absent
 * origin on a state-changing request is suspicious.
 *
 * ## What is NOT checked
 *
 * - GET / HEAD / OPTIONS — safe methods that should not mutate state.
 * - Routes with their own auth: Slack (HMAC), cron (CRON_SECRET), waitlist
 *   (public / token-based). These are listed in CSRF_EXEMPT_PREFIXES.
 */

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * API prefixes that use non-cookie auth and are exempt from CSRF checks.
 *
 * - /api/slack/*       — HMAC signature verification (SLACK_SIGNING_SECRET)
 * - /api/waitlist/*    — public or token-based, no session cookie
 * - /api/shopify/*     — OAuth flow, no session mutation
 * - /api/digest        — cron-only (CRON_SECRET)
 */
const CSRF_EXEMPT_PREFIXES = [
  "/api/slack/",
  "/api/waitlist",
  "/api/shopify/",
  "/api/digest",
] as const;

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(prefix),
  );
}

function extractOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

function getAllowedOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  return raw ? raw.replace(/\/$/, "") : "http://localhost:3000";
}

export type CsrfResult =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Verify that a mutating request originates from our own app.
 *
 * Returns `{ allowed: true }` for safe methods, exempt routes, and requests
 * whose Origin (or Referer) matches NEXT_PUBLIC_APP_URL.
 */
export function verifyCsrfOrigin(req: NextRequest): CsrfResult {
  if (!MUTATING_METHODS.has(req.method)) {
    return { allowed: true };
  }

  if (isCsrfExempt(req.nextUrl.pathname)) {
    return { allowed: true };
  }

  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return { allowed: true };
  }

  const allowed = getAllowedOrigin();

  const origin = req.headers.get("origin");
  if (origin) {
    return origin === allowed
      ? { allowed: true }
      : { allowed: false, reason: `Origin mismatch: got ${origin}` };
  }

  const referer = req.headers.get("referer");
  if (referer) {
    const refererOrigin = extractOrigin(referer);
    return refererOrigin === allowed
      ? { allowed: true }
      : { allowed: false, reason: `Referer origin mismatch: got ${refererOrigin}` };
  }

  return { allowed: false, reason: "Missing Origin and Referer headers" };
}
