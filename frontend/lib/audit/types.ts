/**
 * Security event categories matching the `security_event_category` enum
 * in migration 025_security_events.sql.
 *
 * After running `bun run db:sync`, these can be replaced with
 * `Constants<"public">["Enums"]["security_event_category"]`.
 */
export type SecurityEventCategory =
  | "auth"
  | "privilege"
  | "api_abuse"
  | "data_access"
  | "config_change";

export type SecurityEventSeverity = "critical" | "high" | "medium" | "low";

export type SecurityEvent = {
  readonly organization_id?: string | null;
  readonly user_id?: string | null;
  readonly category: SecurityEventCategory;
  readonly action: string;
  readonly severity?: SecurityEventSeverity;
  readonly ip_address?: string | null;
  readonly user_agent?: string | null;
  readonly metadata?: Record<string, unknown>;
};
