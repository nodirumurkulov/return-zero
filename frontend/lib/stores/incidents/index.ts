import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { sendIncidentNotification } from "@/lib/slack";
import type { Database } from "@/lib/supabase/database.types";

import { BreachDetector, type DetectOpts, type DetectionResult } from "./detect";
import { assertNoSupabaseError, IncidentsError } from "./errors";
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

  private withOrgFilter<T extends { eq: (col: string, val: string) => T }>(
    query: T,
    organizationId: string,
  ): T {
    return query.eq("organization_id", organizationId);
  }

  async listIncidents(organizationId: string): Promise<Incident[]> {
    const query = this.withOrgFilter(
      this.supabase.from("incidents").select("*").order("created_at", { ascending: false }),
      organizationId,
    );

    const { data, error } = await query;
    assertNoSupabaseError(error, "incidents list failed");
    return data ?? [];
  }

  async getIncident(id: string, organizationId: string): Promise<Incident | null> {
    const query = this.withOrgFilter(
      this.supabase.from("incidents").select("*").eq("id", id),
      organizationId,
    );

    const { data, error } = await query.maybeSingle();
    if (error) {
      throw new IncidentsError(`incidents read failed: ${error.message}`);
    }
    return data;
  }

  async getIncidentDetail(id: string, organizationId: string): Promise<IncidentDetail | null> {
    const incidentQuery = this.withOrgFilter(
      this.supabase.from("incidents").select("*").eq("id", id),
      organizationId,
    );

    const [incidentRes, findingsRes, actionsRes, timelineRes] = await Promise.all([
      incidentQuery.single(),
      this.supabase
        .from("agent_findings")
        .select("*")
        .eq("incident_id", id)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true }),
      this.supabase
        .from("incident_actions")
        .select("*")
        .eq("incident_id", id)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true }),
      this.supabase
        .from("incident_timeline")
        .select("*")
        .eq("incident_id", id)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true }),
    ]);

    if (incidentRes.error || !incidentRes.data) return null;
    assertNoSupabaseError(findingsRes.error, "agent_findings read failed");
    assertNoSupabaseError(actionsRes.error, "incident_actions read failed");
    assertNoSupabaseError(timelineRes.error, "incident_timeline read failed");

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
    organizationId: string,
  ): Promise<Incident> {
    const query = this.withOrgFilter(
      this.supabase.from("incidents").update(patch).eq("id", id),
      organizationId,
    );

    const { data, error } = await query.select().single();
    assertNoSupabaseError(error, "incidents update failed");
    if (!data) {
      throw new IncidentsError("incidents update failed: no row returned");
    }
    return data;
  }

  async listLowRiskProposedActionIds(
    incidentId: string,
    organizationId: string,
  ): Promise<string[]> {
    const { data, error } = await this.supabase
      .from("incident_actions")
      .select("id")
      .eq("incident_id", incidentId)
      .eq("organization_id", organizationId)
      .eq("status", "proposed")
      .eq("risk_level", "low");

    assertNoSupabaseError(error, "incident_actions read failed");
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
      throw new IncidentsError(incidentErr?.message ?? "Incident not found");
    }

    const organizationId = incident.organization_id;
    const now = new Date().toISOString();

    const { error: actionErr } = await this.supabase
      .from("incident_actions")
      .update({ status: "approved", approved_by_user_id: approvedByUserId, approved_at: now })
      .in("id", actionIds)
      .eq("organization_id", organizationId);

    assertNoSupabaseError(actionErr, "incident_actions approve failed");

    const { error: deployingErr } = await this.supabase
      .from("incidents")
      .update({ status: "deploying" })
      .eq("id", incidentId)
      .eq("organization_id", organizationId);

    assertNoSupabaseError(deployingErr, "incidents deploying update failed");

    const { error: approvedTimelineErr } = await this.supabase.from("incident_timeline").insert({
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

    assertNoSupabaseError(approvedTimelineErr, "incident_timeline approved insert failed");

    const { error: deployActionsErr } = await this.supabase
      .from("incident_actions")
      .update({ status: "deployed", deployed_at: now })
      .in("id", actionIds)
      .eq("organization_id", organizationId);

    assertNoSupabaseError(deployActionsErr, "incident_actions deploy failed");

    const { error: monitoringErr } = await this.supabase
      .from("incidents")
      .update({ status: "monitoring" })
      .eq("id", incidentId)
      .eq("organization_id", organizationId);

    assertNoSupabaseError(monitoringErr, "incidents monitoring update failed");

    const { error: deployedTimelineErr } = await this.supabase.from("incident_timeline").insert({
      incident_id: incidentId,
      organization_id: organizationId,
      event_type: "deployed",
      description: "Actions deployed — incident now in monitoring",
    });

    assertNoSupabaseError(deployedTimelineErr, "incident_timeline deployed insert failed");

    return { approved: actionIds.length };
  }

  async completeApproval(
    input: ApproveActionsInput & { organizationId: string; appUrl: string },
  ): Promise<{ approved: number }> {
    const result = await this.approveIncidentActions(input);
    const incident = await this.getIncident(input.incidentId, input.organizationId);
    if (incident) {
      await sendIncidentNotification({
        title: incident.title,
        severity: incident.severity,
        status: "monitoring",
        impact_amount: incident.impact_amount,
        impact_label: incident.impact_label,
        root_cause: incident.root_cause,
        root_cause_confidence: incident.root_cause_confidence,
        incident_id: input.incidentId,
        app_url: input.appUrl,
      });

      if (incident.product_id) {
        await this.captureRecoveryBaseline(
          input.organizationId,
          input.incidentId,
          incident.product_id,
          incident.affected_kpi_keys,
        );
      }
    }
    return result;
  }
}

export function createIncidents(supabase: SupabaseClient<Database>): Incidents {
  return new Incidents(supabase);
}

export { IncidentsError } from "./errors";
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
