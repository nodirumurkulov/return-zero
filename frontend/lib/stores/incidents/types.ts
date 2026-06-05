import type { Database } from "@/lib/supabase/database.types";

import type { UpdateIncidentBody } from "./schemas";

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

export type ApproveActionsInput = {
  incidentId: string;
  actionIds: string[];
  approvedByUserId: string | null;
  extraMetadata?: Record<string, unknown>;
};

export type IncidentsListOpts = {
  organizationId: string;
};

export type IncidentsGetOpts = {
  id: string;
  organizationId: string;
};

export type IncidentsUpdateOpts = {
  id: string;
  organizationId: string;
  patch: UpdateIncidentBody;
};

export type ListIncidentActionIdsOpts = {
  incidentId: string;
  organizationId: string;
  filter?: {
    status?: IncidentAction["status"];
    riskLevel?: NonNullable<IncidentAction["risk_level"]>;
  };
};

export type ApproveIncidentAndNotifyOpts = ApproveActionsInput & {
  organizationId: string;
  appUrl: string;
};
