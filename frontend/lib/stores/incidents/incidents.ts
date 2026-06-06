import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyNewIncident, sendIncidentNotification } from "@/lib/slack";
import { computeMetrics } from "@/lib/stores/metrics/engine";
import type { Database } from "@/lib/supabase/database.types";

import { IncidentsError } from "./errors";
import { TERMINAL_INCIDENT_STATUSES } from "./types";
import type {
  ApproveActionsInput,
  ApproveIncidentAndNotifyOpts,
  CreatedIncident,
  DetectOpts,
  DetectionResult,
  Incident,
  IncidentDetail,
  IncidentsGetOpts,
  IncidentsListOpts,
  IncidentsUpdateOpts,
  ListIncidentActionIdsOpts,
} from "./types";

export class Incidents {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(opts: IncidentsListOpts): Promise<Incident[]> {
    const { data, error } = await this.supabase
      .from("incidents")
      .select("*")
      .eq("organization_id", opts.organizationId)
      .order("created_at", { ascending: false });

    if (error) throw new IncidentsError(`incidents list failed: ${error.message}`);
    return data ?? [];
  }

  /** Single `incidents` row — kanban cards, Slack, notifications. */
  async get(opts: IncidentsGetOpts): Promise<Incident | null> {
    const { data, error } = await this.supabase
      .from("incidents")
      .select("*")
      .eq("id", opts.id)
      .eq("organization_id", opts.organizationId)
      .maybeSingle();

    if (error) throw new IncidentsError(`incidents read failed: ${error.message}`);
    return data;
  }

  /** Incident row plus findings, actions, and timeline. */
  async getDetail(opts: IncidentsGetOpts): Promise<IncidentDetail | null> {
    const { id, organizationId } = opts;

    const [incidentRes, findingsRes, actionsRes, timelineRes] = await Promise.all([
      this.supabase
        .from("incidents")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .single(),
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
    if (findingsRes.error) {
      throw new IncidentsError(`agent_findings read failed: ${findingsRes.error.message}`);
    }
    if (actionsRes.error) {
      throw new IncidentsError(`incident_actions read failed: ${actionsRes.error.message}`);
    }
    if (timelineRes.error) {
      throw new IncidentsError(`incident_timeline read failed: ${timelineRes.error.message}`);
    }

    return {
      incident: incidentRes.data,
      findings: findingsRes.data ?? [],
      actions: actionsRes.data ?? [],
      timeline: timelineRes.data ?? [],
    };
  }

  async update(opts: IncidentsUpdateOpts): Promise<Incident> {
    const { data, error } = await this.supabase
      .from("incidents")
      .update(opts.patch)
      .eq("id", opts.id)
      .eq("organization_id", opts.organizationId)
      .select()
      .single();

    if (error) throw new IncidentsError(`incidents update failed: ${error.message}`);
    if (!data) throw new IncidentsError("incidents update failed: no row returned");
    return data;
  }

  async detect(opts: DetectOpts): Promise<DetectionResult> {
    const { organizationId, productId } = opts;

    const metrics =
      (await computeMetrics(this.supabase, {
        organizationId,
        productId,
        asOf: opts.asOf,
      }))[productId] ?? [];

    // critical = value breached its threshold (below or above, per metric direction)
    const breached = metrics.filter((m) => m.status === "critical");
    if (breached.length === 0) {
      return { scanned: 1, created: [], skipped: [] };
    }

    const { data: openIncidents, error: incErr } = await this.supabase
      .from("incidents")
      .select("status")
      .eq("organization_id", organizationId)
      .eq("product_id", productId);
    if (incErr) throw new IncidentsError(`load incidents: ${incErr.message}`);

    const hasOpenIncident = (openIncidents ?? []).some(
      (r) => !(TERMINAL_INCIDENT_STATUSES as readonly string[]).includes(r.status),
    );
    if (hasOpenIncident) {
      return {
        scanned: 1,
        created: [],
        skipped: [{ product_id: productId, reason: "open incident exists" }],
      };
    }

    const primary = breached[0];
    const affected_kpi_keys = breached.map((m) => m.metric_key);

    const { data: product, error: prodErr } = await this.supabase
      .from("products")
      .select("title")
      .eq("organization_id", organizationId)
      .eq("id", productId)
      .maybeSingle();
    if (prodErr) throw new IncidentsError(`load product: ${prodErr.message}`);

    const productTitle = product?.title ?? productId;
    const title = `${productTitle}: ${primary.display_name} breach`;
    const severity = primary.severity;

    const { data: inc, error: insErr } = await this.supabase
      .from("incidents")
      .insert({
        organization_id: organizationId,
        title,
        status: "detected",
        severity,
        impact_amount: 0,
        impact_label: null,
        product_id: productId,
        affected_kpi_keys,
      })
      .select("id")
      .single();
    if (insErr || !inc) {
      return {
        scanned: 1,
        created: [],
        skipped: [{ product_id: productId, reason: `insert failed: ${insErr?.message ?? "no row"}` }],
      };
    }

    await this.supabase.from("incident_timeline").insert({
      incident_id: inc.id,
      organization_id: organizationId,
      event_type: "incident_created",
      description: `KPI threshold breach: ${affected_kpi_keys.join(", ")}`,
      metadata: {
        breaches: breached.map((m) => ({
          metric: m.metric_key,
          value: m.value,
          threshold: m.threshold,
          direction: m.direction,
        })),
      },
    });

    return {
      scanned: 1,
      created: [
        {
          incident_id: inc.id,
          product_id: productId,
          title,
          severity,
          affected_kpi_keys,
          impact_amount: 0,
          impact_label: null,
        },
      ],
      skipped: [],
    };
  }

  /** Slack fan-out when breach detection creates new incidents. */
  async notifyNew(organizationId: string, incidents: readonly CreatedIncident[]): Promise<void> {
    await Promise.all(
      incidents.map((inc) =>
        notifyNewIncident(this.supabase, {
          organization_id: organizationId,
          incident_id: inc.incident_id,
          title: inc.title,
          severity: inc.severity,
          impact_amount: inc.impact_amount,
          impact_label: inc.impact_label,
        }),
      ),
    );
  }

  async listActionIds(opts: ListIncidentActionIdsOpts): Promise<string[]> {
    const baseQuery = this.supabase
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
    if (error) throw new IncidentsError(`incident_actions read failed: ${error.message}`);
    return (data ?? []).map((row) => row.id);
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

    if (actionErr) throw new IncidentsError(`incident_actions approve failed: ${actionErr.message}`);

    const { error: deployingErr } = await this.supabase
      .from("incidents")
      .update({ status: "deploying" })
      .eq("id", incidentId)
      .eq("organization_id", organizationId);

    if (deployingErr) {
      throw new IncidentsError(`incidents deploying update failed: ${deployingErr.message}`);
    }

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

    if (approvedTimelineErr) {
      throw new IncidentsError(`incident_timeline approved insert failed: ${approvedTimelineErr.message}`);
    }

    const { error: deployActionsErr } = await this.supabase
      .from("incident_actions")
      .update({ status: "deployed", deployed_at: now })
      .in("id", actionIds)
      .eq("organization_id", organizationId);

    if (deployActionsErr) {
      throw new IncidentsError(`incident_actions deploy failed: ${deployActionsErr.message}`);
    }

    const { error: monitoringErr } = await this.supabase
      .from("incidents")
      .update({ status: "monitoring" })
      .eq("id", incidentId)
      .eq("organization_id", organizationId);

    if (monitoringErr) {
      throw new IncidentsError(`incidents monitoring update failed: ${monitoringErr.message}`);
    }

    const { error: deployedTimelineErr } = await this.supabase.from("incident_timeline").insert({
      incident_id: incidentId,
      organization_id: organizationId,
      event_type: "deployed",
      description: "Actions deployed — incident now in monitoring",
    });

    if (deployedTimelineErr) {
      throw new IncidentsError(`incident_timeline deployed insert failed: ${deployedTimelineErr.message}`);
    }

    return { approved: actionIds.length };
  }

  async approveAndNotify(opts: ApproveIncidentAndNotifyOpts): Promise<{ approved: number }> {
    const result = await this.approve(opts);
    const incident = await this.get({
      id: opts.incidentId,
      organizationId: opts.organizationId,
    });
    if (incident) {
      await sendIncidentNotification(
        {
          organization_id: opts.organizationId,
          title: incident.title,
          severity: incident.severity,
          status: "monitoring",
          impact_amount: incident.impact_amount,
          impact_label: incident.impact_label,
          root_cause: incident.root_cause,
          root_cause_confidence: incident.root_cause_confidence,
          incident_id: opts.incidentId,
          app_url: opts.appUrl,
        },
        this.supabase,
      );
    }
    return result;
  }
}
