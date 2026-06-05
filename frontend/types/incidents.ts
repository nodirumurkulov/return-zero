import type { Database } from "@/lib/supabase/database.types";

export type Incident = Database["public"]["Tables"]["incidents"]["Row"];
export type IncidentAction = Database["public"]["Tables"]["incident_actions"]["Row"];
export type AgentFinding = Database["public"]["Tables"]["agent_findings"]["Row"];
export type TimelineEvent = Database["public"]["Tables"]["incident_timeline"]["Row"];

export type IncidentRef = {
  readonly id: string;
};

export type IncidentDetail = {
  incident: Incident;
  findings: AgentFinding[];
  actions: IncidentAction[];
  timeline: TimelineEvent[];
};

export const INCIDENT_STATUSES = [
  "detected",
  "investigating",
  "fix_proposed",
  "awaiting_approval",
  "deploying",
  "monitoring",
  "resolved",
  "canceled",
] as const;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

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
