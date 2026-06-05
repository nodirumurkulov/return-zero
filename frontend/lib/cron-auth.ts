import { type NextRequest, NextResponse } from "next/server";

export const CRON_API_PATHS = [
  "/api/digest",
  "/api/stores/incidents/detect",
  "/api/stores/incidents/forecast-risk",
  "/api/stores/incidents/recover",
  "/api/stores/analytics/replay",
] as const;

export function getCronSecret(): string | undefined {
  const secret = process.env.CRON_SECRET?.trim();
  return secret || undefined;
}

export function isCronSecretConfigured(): boolean {
  return getCronSecret() !== undefined;
}

export function cronAuthRequired(): boolean {
  return process.env.NODE_ENV === "production" || isCronSecretConfigured();
}

export function hasCronAuth(req: NextRequest): boolean {
  const secret = getCronSecret();
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? req.headers.get("x-cron-secret");
  return auth === `Bearer ${secret}` || auth === secret;
}

export function matchesCronPath(pathname: string): boolean {
  return CRON_API_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** True when the request is an authenticated cron invocation (all-org admin mode). */
export function isCronInvocation(req: NextRequest, cronDenied: NextResponse | null): boolean {
  return cronDenied === null && isCronSecretConfigured() && hasCronAuth(req);
}

/** Returns a 401/503 response when cron auth fails; null when the request may proceed. */
export function assertCronAuthorized(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV === "production" && !isCronSecretConfigured()) {
    return NextResponse.json(
      { error: "CRON_SECRET is required in production for scheduler routes" },
      { status: 503 },
    );
  }

  if (!isCronSecretConfigured()) {
    return null;
  }

  if (!hasCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
