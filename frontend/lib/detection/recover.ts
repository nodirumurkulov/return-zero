import type { SupabaseClient } from "@supabase/supabase-js";
import { computeProductMetrics } from "../metrics/engine";

// Recovery loop (RUN-22/23). When a fix is deployed the incident is in
// `monitoring`; we snapshot the breached KPI (baseline + target) and then track
// PROJECTED recovery toward target over a horizon, auto-resolving at 100%.
//
// Assumption (stated, per spec): this fixture has no post-fix data, so recovery
// is a transparent projection of the deployed action's expected effect — not a
// measurement of new data.

/** Snapshot the incident's primary KPI when it enters monitoring. */
export async function captureRecoveryBaseline(
  supabase: SupabaseClient,
  organizationId: string,
  incidentId: string,
  productId: string,
  affectedKpiKeys: string[] | null,
): Promise<void> {
  const metrics = await computeProductMetrics(supabase, organizationId, productId);
  if (metrics.length === 0) return;
  const primaryKey = affectedKpiKeys?.[0];
  const m =
    metrics.find((x) => x.metric_key === primaryKey) ??
    metrics.find((x) => x.status === "critical") ??
    metrics[0];
  if (!m || m.value === null) return;

  await supabase
    .from("incidents")
    .update({
      monitoring_kpi: m.metric_key,
      baseline_value: m.value,
      target_value: m.threshold,
      monitoring_started_at: new Date().toISOString(),
      recovery_pct: 0,
    })
    .eq("id", incidentId)
    .eq("organization_id", organizationId);
}

export interface RecoveryResult {
  monitored: number;
  updated: number;
  resolved: string[];
}

export interface RecoverOpts {
  organizationId: string;
  advanceDays?: number;
}

/**
 * Advance projected recovery for all monitoring incidents and auto-resolve
 * those that reach 100%. `advanceDays` overrides elapsed time (lets the demo
 * fast-forward the monitoring clock); otherwise real days since monitoring start.
 */
export async function runRecovery(
  supabase: SupabaseClient,
  opts: RecoverOpts,
): Promise<RecoveryResult> {
  const { data: setRows } = await supabase
    .from("business_settings")
    .select("key, value")
    .eq("organization_id", opts.organizationId);
  const horizon = Number((setRows ?? []).find((s) => s.key === "recovery_horizon_days")?.value ?? 21);

  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, monitoring_kpi, monitoring_started_at")
    .eq("organization_id", opts.organizationId)
    .eq("status", "monitoring");

  const resolved: string[] = [];
  const nowMs = Date.now();
  const active = (incidents ?? []).filter((inc) => inc.monitoring_started_at);

  for (const inc of active) {
    const elapsedDays =
      opts.advanceDays ??
      Math.max(0, (nowMs - new Date(inc.monitoring_started_at).getTime()) / 86_400_000);
    const pct = horizon > 0 ? Math.min(1, elapsedDays / horizon) : 1;

    await supabase
      .from("incidents")
      .update({ recovery_pct: pct })
      .eq("id", inc.id)
      .eq("organization_id", opts.organizationId);

    if (pct >= 1) {
      const now = new Date().toISOString();
      await supabase
        .from("incidents")
        .update({ status: "resolved", resolved_at: now })
        .eq("id", inc.id)
        .eq("organization_id", opts.organizationId);
      await supabase.from("incident_timeline").insert([
        {
          incident_id: inc.id,
          event_type: "monitoring",
          description: `Projected recovery reached 100% for ${inc.monitoring_kpi ?? "KPI"}`,
        },
        {
          incident_id: inc.id,
          event_type: "resolved",
          description: "Auto-resolved — KPI projected back within target",
        },
      ]);
      resolved.push(inc.id as string);
    } else {
      await supabase.from("incident_timeline").insert({
        incident_id: inc.id,
        event_type: "monitoring",
        description: `Projected recovery ${Math.round(pct * 100)}%`,
      });
    }
  }

  return { monitored: (incidents ?? []).length, updated: active.length, resolved };
}
