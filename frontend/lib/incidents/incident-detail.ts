import type { AgentFinding } from "@/lib/incidents/agent-finding";
import type { Incident } from "@/lib/incidents/incident";
import type { IncidentAction } from "@/lib/incidents/incident-action";
import type { TimelineEvent } from "@/lib/incidents/timeline-event";

export type IncidentDetail = {
  incident: Incident;
  findings: AgentFinding[];
  actions: IncidentAction[];
  timeline: TimelineEvent[];
};
