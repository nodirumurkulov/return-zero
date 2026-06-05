import { Constants } from "@/lib/supabase/database.types";

/** Kanban + workflow statuses for incidents. */

export const INCIDENT_STATUSES = Constants.public.Enums.incident_status;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_SEVERITIES = Constants.public.Enums.incident_severity;

export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const TERMINAL_INCIDENT_STATUSES = ["resolved", "canceled"] as const;

export function isIncidentStatus(value: string): value is IncidentStatus {
  return (INCIDENT_STATUSES as readonly string[]).includes(value);
}

export const KANBAN_STATUSES = [
  "detected",
  "investigating",
  "fix_proposed",
  "awaiting_approval",
  "monitoring",
  "resolved",
] as const;

export type KanbanStatus = (typeof KANBAN_STATUSES)[number];

export const KANBAN_COLUMNS: { status: KanbanStatus; label: string }[] = [
  { status: "detected", label: "Detected" },
  { status: "investigating", label: "Investigating" },
  { status: "fix_proposed", label: "Fix Proposed" },
  { status: "awaiting_approval", label: "Awaiting Approval" },
  { status: "monitoring", label: "Monitoring" },
  { status: "resolved", label: "Resolved" },
];
