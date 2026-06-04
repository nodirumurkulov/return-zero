/** Workflow statuses — must match supabase/migrations/002_incidents_schema.sql */
export const INCIDENT_STATUSES = [
  "detected",
  "investigating",
  "fix_proposed",
  "awaiting_approval",
  "deploying",
  "monitoring",
  "resolved",
] as const;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export function isIncidentStatus(value: string): value is IncidentStatus {
  return (INCIDENT_STATUSES as readonly string[]).includes(value);
}

/** Kanban column order (same as workflow). */
export const INCIDENT_KANBAN_COLUMNS: { status: IncidentStatus }[] =
  INCIDENT_STATUSES.map((status) => ({ status }));
