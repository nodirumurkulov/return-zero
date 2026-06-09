import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import type { SecurityEvent } from "./types";

/**
 * Append a security event to the `security_events` audit log.
 *
 * Best-effort: never throws — logs to stderr on failure so the
 * calling request is not disrupted by audit infrastructure issues.
 */
export async function logSecurityEvent(
  supabase: SupabaseClient<Database>,
  event: SecurityEvent,
): Promise<void> {
  try {
    const { error } = await supabase.from("security_events" as never).insert({
      organization_id: event.organization_id ?? null,
      user_id: event.user_id ?? null,
      category: event.category,
      action: event.action,
      severity: event.severity ?? "low",
      ip_address: event.ip_address ?? null,
      user_agent: event.user_agent ?? null,
      metadata: event.metadata ?? {},
    } as never);

    if (error) {
      // eslint-disable-next-line no-console -- best-effort audit; stderr is intentional
      console.error("[audit] security_events insert failed:", error.message);
    }
  } catch (err) {
    // eslint-disable-next-line no-console -- best-effort audit; stderr is intentional
    console.error("[audit] security_events unexpected error:", err);
  }
}

/** Extract client IP from request headers. */
export function getRequestIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip");
}
