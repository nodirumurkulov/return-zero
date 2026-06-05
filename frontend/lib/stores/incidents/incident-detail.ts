import type { AgentFinding } from "./agent-finding";
import type { Incident } from "./incident";
import type { IncidentAction } from "./incident-action";
import type { TimelineEvent } from "./timeline-event";

export type IncidentDetail = {
  incident: Incident;
  findings: AgentFinding[];
  actions: IncidentAction[];
  timeline: TimelineEvent[];
};
