import type { SupabaseClient } from "@supabase/supabase-js";

import { computeProductMetrics } from "@/lib/metrics/engine";

export interface RecoveryResult {
  monitored: number;
  updated: number;
  resolved: string[];
}

export interface RecoverOpts {
  organizationId: string;
  advanceDays?: number;
}

export class RecoveryService {
  constructor(private readonly supabase: SupabaseClient) {}

  async captureBaseline(
    organizationId: string,
    incidentId: string,
    productId: string,
    affectedKpiKeys: string[] | null,
  ): Promise<void> {
    const metrics = await computeProductMetrics(this.supabase, organizationId, productId);
    if (metrics.length === 0) return;
    const primaryKey = affectedKpiKeys?.[0];
    const m =
      metrics.find((x) => x.metric_key === primaryKey) ??
      metrics.find((x) => x.status === "critical") ??
      metrics[0];
    if (!m || m.value === null) return;

    await this.supabase
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

  async run(opts: RecoverOpts): Promise<RecoveryResult> {
    const { data: setRows } = await this.supabase
      .from("business_settings")
      .select("key, value")
      .eq("organization_id", opts.organizationId);
    const horizon = Number(
      (setRows ?? []).find((s) => s.key === "recovery_horizon_days")?.value ?? 21,
    );

    const { data: incidents } = await this.supabase
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

      await this.supabase
        .from("incidents")
        .update({ recovery_pct: pct })
        .eq("id", inc.id)
        .eq("organization_id", opts.organizationId);

      if (pct >= 1) {
        const now = new Date().toISOString();
        await this.supabase
          .from("incidents")
          .update({ status: "resolved", resolved_at: now })
          .eq("id", inc.id)
          .eq("organization_id", opts.organizationId);
        await this.supabase.from("incident_timeline").insert([
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
        await this.supabase.from("incident_timeline").insert({
          incident_id: inc.id,
          event_type: "monitoring",
          description: `Projected recovery ${Math.round(pct * 100)}%`,
        });
      }
    }

    return { monitored: (incidents ?? []).length, updated: active.length, resolved };
  }
}

