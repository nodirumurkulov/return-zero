import "server-only";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Route-level auth guards (defense-in-depth on top of middleware.ts).
// Even if the middleware matcher is ever misconfigured, these ensure a
// request without a valid Clerk session cannot reach the service-role client.

/** 401 NextResponse when there is no authenticated Clerk user, else null. */
export async function requireUser(): Promise<NextResponse | null> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** True when the request carries a valid CRON_SECRET (bearer or raw header). */
export function hasValidCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header =
    req.headers.get("authorization") ?? req.headers.get("x-cron-secret");
  return header === `Bearer ${secret}` || header === secret;
}

/**
 * For scheduler-triggerable routes: allow either an authenticated Clerk user
 * (manual trigger from the app) or a valid CRON_SECRET (Vercel cron). Returns
 * a 401 NextResponse when neither is present, else null.
 */
export async function requireUserOrCron(
  req: Request
): Promise<NextResponse | null> {
  if (hasValidCronSecret(req)) return null;
  return requireUser();
}

/** Returns the Clerk userId or null. Convenience for Server Actions. */
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
