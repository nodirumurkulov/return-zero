import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getCurrentOrganizationId } from "@/lib/organizations/queries";
import type { Database } from "@/lib/supabase/database.types";

import { BreachDetector, type DetectOpts, type DetectionResult } from "./detect";
import { ForecastRiskDetector, type ForecastDetectOpts, type ForecastDetectionResult } from "./forecast-risk";
import { RecoveryService, type RecoverOpts, type RecoveryResult } from "./recover";
import type { UpdateIncidentBody } from "./schemas";
import type { Incident, IncidentDetail } from "./types";

export type ApproveActionsInput = {
  incidentId: string;
  actionIds: string[];
  approvedByUserId: string | null;
  extraMetadata?: Record<string, unknown>;
};

export class Incidents {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private async resolveOrganizationId(organizationId?: string): Promise<string | null> {
    return organizationId ?? (await getCurrentOrganizationId(this.supabase));
  }

  private withOrgFilter<T extends { eq: (col: string, val: string) => T }>(
    query: T,
    organizationId: string | null,
  ): T {
    return organizationId ? query.eq("organization_id", organizationId) : query;
  }

  async listIncidents(organizationId?: string): Promise<Incident[]> {
    const orgId = await this.resolveOrganizationId(organizationId);
    const query = this.withOrgFilter(
      this.supabase.from("incidents").select("*").order("created_at", { ascending: false }),
      orgId,
    );

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getIncident(id: string, organizationId?: string): Promise<Incident | null> {
    const orgId = await this.resolveOrganizationId(organizationId);
    const query = this.withOrgFilter(
      this.supabase.from("incidents").select("*").eq("id", id),
      orgId,
    );

    const { data, error } = await query.single();
    if (error || !data) return null;
    return data;
  }

  async getIncidentDetail(id: string, organizationId?: string): Promise<IncidentDetail | null> {
    const orgId = await this.resolveOrganizationId(organizationId);
    const incidentQuery = this.withOrgFilter(
      this.supabase.from("incidents").select("*").eq("id", id),
      orgId,
    );

    const findingsQuery = this.supabase
      .from("agent_findings")
      .select("*")
      .eq("incident_id", id);
    const actionsQuery = this.supabase
      .from("incident_actions")
      .select("*")
      .eq("incident_id", id);
    const timelineQuery = this.supabase
      .from("incident_timeline")
      .select("*")
      .eq("incident_id", id);

    const scopedFindings = orgId ? findingsQuery.eq("organization_id", orgId) : findingsQuery;
    const scopedActions = orgId ? actionsQuery.eq("organization_id", orgId) : actionsQuery;
    const scopedTimeline = orgId ? timelineQuery.eq("organization_id", orgId) : timelineQuery;

    const [incidentRes, findingsRes, actionsRes, timelineRes] = await Promise.all([
      incidentQuery.single(),
      scopedFindings.order("created_at", { ascending: true }),
      scopedActions.order("created_at", { ascending: true }),
      scopedTimeline.order("created_at", { ascending: true }),
    ]);

    if (incidentRes.error || !incidentRes.data) return null;

    return {
      incident: incidentRes.data,
      findings: findingsRes.data ?? [],
      actions: actionsRes.data ?? [],
      timeline: timelineRes.data ?? [],
    };
  }

  async patchIncident(
    id: string,
    patch: UpdateIncidentBody,
    organizationId?: string,
  ): Promise<Incident> {
    const orgId = await this.resolveOrganizationId(organizationId);
    const query = this.withOrgFilter(
      this.supabase.from("incidents").update(patch).eq("id", id),
      orgId,
    );

    const { data, error } = await query.select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async listLowRiskProposedActionIds(
    incidentId: string,
    organizationId?: string,
  ): Promise<string[]> {
    const query = this.supabase
      .from("incident_actions")
      .select("id")
      .eq("incident_id", incidentId)
      .eq("status", "proposed")
      .eq("risk_level", "low");

    const { data } = organizationId
      ? await query.eq("organization_id", organizationId)
      : await query;

    return (data ?? []).map((row) => row.id);
  }

  async detectBreaches(opts: DetectOpts): Promise<DetectionResult> {
    return new BreachDetector(this.supabase).run(opts);
  }

  async detectForecastRisks(opts: ForecastDetectOpts): Promise<ForecastDetectionResult> {
    return new ForecastRiskDetector(this.supabase).run(opts);
  }

  async captureRecoveryBaseline(
    organizationId: string,
    incidentId: string,
    productId: string,
    affectedKpiKeys: string[] | null,
  ): Promise<void> {
    return new RecoveryService(this.supabase).captureBaseline(
      organizationId,
      incidentId,
      productId,
      affectedKpiKeys,
    );
  }

  async runRecovery(opts: RecoverOpts): Promise<RecoveryResult> {
    return new RecoveryService(this.supabase).run(opts);
  }

  async approveIncidentActions(input: ApproveActionsInput): Promise<{ approved: number }> {
    const { incidentId, actionIds, approvedByUserId, extraMetadata } = input;
    if (actionIds.length === 0) {
      return { approved: 0 };
    }

    const { data: incident, error: incidentErr } = await this.supabase
      .from("incidents")
      .select("organization_id")
      .eq("id", incidentId)
      .single();

    if (incidentErr || !incident) {
      throw new Error(incidentErr?.message ?? "Incident not found");
    }

    const organizationId = incident.organization_id;
    const now = new Date().toISOString();

    const { error: actionErr } = await this.supabase
      .from("incident_actions")
      .update({ status: "approved", approved_by_user_id: approvedByUserId, approved_at: now })
      .in("id", actionIds)
      .eq("organization_id", organizationId);

    if (actionErr) throw new Error(actionErr.message);

    await this.supabase
      .from("incidents")
      .update({ status: "deploying" })
      .eq("id", incidentId)
      .eq("organization_id", organizationId);

    await this.supabase.from("incident_timeline").insert({
      incident_id: incidentId,
      organization_id: organizationId,
      event_type: "approved",
      description: `${actionIds.length} action(s) approved`,
      metadata: {
        action_ids: actionIds,
        approved_by_user_id: approvedByUserId,
        ...extraMetadata,
      },
    });

    await this.supabase
      .from("incident_actions")
      .update({ status: "deployed", deployed_at: now })
      .in("id", actionIds)
      .eq("organization_id", organizationId);

    await this.supabase
      .from("incidents")
      .update({ status: "monitoring" })
      .eq("id", incidentId)
      .eq("organization_id", organizationId);

    await this.supabase.from("incident_timeline").insert({
      incident_id: incidentId,
      organization_id: organizationId,
      event_type: "deployed",
      description: "Actions deployed — incident now in monitoring",
    });

    return { approved: actionIds.length };
  }
}

export function createIncidents(supabase: SupabaseClient<Database>): Incidents {
  return new Incidents(supabase);
}

export * from "./types";
export * from "./status";
export * from "./schemas";
export type {
  CreatedForecastIncident,
  ForecastDetectOpts,
  ForecastDetectionResult,
} from "./forecast-risk";
export type { CreatedIncident, DetectOpts, DetectionResult } from "./detect";
export type { RecoverOpts, RecoveryResult } from "./recover";
export * from "./api";
