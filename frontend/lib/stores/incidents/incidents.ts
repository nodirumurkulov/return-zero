import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { sendIncidentNotification } from "@/lib/slack";
import type { Database } from "@/lib/supabase/database.types";

import { BreachDetector, type DetectOpts, type DetectionResult } from "./detect";
import { assertNoSupabaseError, IncidentsError } from "./errors";
import type {
  ApproveActionsInput,
  ApproveIncidentAndNotifyOpts,
  Incident,
  IncidentDetail,
  IncidentsGetOpts,
  IncidentsListOpts,
  IncidentsUpdateOpts,
  ListIncidentActionIdsOpts,
} from "./types";

export class Incidents {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  private withOrgFilter<T extends { eq: (col: string, val: string) => T }>(
    query: T,
    organizationId: string,
  ): T {
    return query.eq("organization_id", organizationId);
  }

  async list(opts: IncidentsListOpts): Promise<Incident[]> {
    const query = this.withOrgFilter(
      this.supabase.from("incidents").select("*").order("created_at", { ascending: false }),
      opts.organizationId,
    );

    const { data, error } = await query;
    assertNoSupabaseError(error, "incidents list failed");
    return data ?? [];
  }

  /** Single `incidents` row — kanban cards, Slack, notifications. */
  async get(opts: IncidentsGetOpts): Promise<Incident | null> {
    const query = this.withOrgFilter(
      this.supabase.from("incidents").select("*").eq("id", opts.id),
      opts.organizationId,
    );

    const { data, error } = await query.maybeSingle();
    if (error) {
      throw new IncidentsError(`incidents read failed: ${error.message}`);
    }
    return data;
  }

  /** Incident row plus findings, actions, and timeline. */
  async getDetail(opts: IncidentsGetOpts): Promise<IncidentDetail | null> {
    const { id, organizationId } = opts;
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

  async update(opts: IncidentsUpdateOpts): Promise<Incident> {
    const query = this.withOrgFilter(
      this.supabase.from("incidents").update(opts.patch).eq("id", opts.id),
      opts.organizationId,
    );

    const { data, error } = await query.select().single();
    assertNoSupabaseError(error, "incidents update failed");
    if (!data) {
      throw new IncidentsError("incidents update failed: no row returned");
    }
    return data;
  }

  async detect(opts: DetectOpts): Promise<DetectionResult> {
    return new BreachDetector(this.supabase).run(opts);
  }

  async approve(input: ApproveActionsInput): Promise<{ approved: number }> {
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
}

export async function listIncidentActionIds(
  supabase: SupabaseClient<Database>,
  opts: ListIncidentActionIdsOpts,
): Promise<string[]> {
  const baseQuery = supabase
    .from("incident_actions")
    .select("id")
    .eq("incident_id", opts.incidentId)
    .eq("organization_id", opts.organizationId);

  const queryWithStatus = opts.filter?.status
    ? baseQuery.eq("status", opts.filter.status)
    : baseQuery;
  const query =
    opts.filter?.riskLevel != null
      ? queryWithStatus.eq("risk_level", opts.filter.riskLevel)
      : queryWithStatus;

  const { data, error } = await query;
  assertNoSupabaseError(error, "incident_actions read failed");
  return (data ?? []).map((row) => row.id);
}

export async function approveIncidentAndNotify(
  supabase: SupabaseClient<Database>,
  opts: ApproveIncidentAndNotifyOpts,
): Promise<{ approved: number }> {
  const incidents = new Incidents(supabase);
  const result = await incidents.approve(opts);
  const incident = await incidents.get({
    id: opts.incidentId,
    organizationId: opts.organizationId,
  });
  if (incident) {
    await sendIncidentNotification({
      title: incident.title,
      severity: incident.severity,
      status: "monitoring",
      impact_amount: incident.impact_amount,
      impact_label: incident.impact_label,
      root_cause: incident.root_cause,
      root_cause_confidence: incident.root_cause_confidence,
      incident_id: opts.incidentId,
      app_url: opts.appUrl,
    });
  }
  return result;
}
