"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SeverityBadge from "@/components/ui/SeverityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import ImpactTag from "@/components/ui/ImpactTag";
import SectionLabel from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AgentFindingCard, { type AgentFinding } from "@/components/incidents/AgentFindingCard";
import ActionList, { type IncidentAction } from "@/components/incidents/ActionList";
import IncidentTimeline, { type TimelineEvent } from "@/components/incidents/IncidentTimeline";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

type Incident = {
  id: string;
  title: string;
  status: string;
  severity: string;
  impact_amount?: number | null;
  impact_label?: string | null;
  root_cause?: string | null;
  root_cause_confidence?: number | null;
  created_at: string;
  affected_kpis?: string[] | null;
  affected_product?: string | null;
  monitoring_kpi?: string | null;
  baseline_value?: number | null;
  target_value?: number | null;
  recovery_pct?: number | null;
};

type IncidentDetail = {
  incident: Incident;
  findings: AgentFinding[];
  actions: IncidentAction[];
  timeline: TimelineEvent[];
};

export default function IncidentDetailPage() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const router = useRouter();
  const [data, setData] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}`);
      const json = (await res.json()) as IncidentDetail & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Not found");
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function triggerInvestigation() {
    if (!data?.incident.affected_product) return;
    setInvestigating(true);
    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: incidentId,
          product_id: data.incident.affected_product,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Investigation failed");
      await load();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Investigation failed");
    } finally {
      setInvestigating(false);
    }
  }

  function handleActionsUpdate() {
    load();
    router.refresh();
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-2/3 max-w-lg" />
        <Skeleton className="h-24 w-full max-w-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState
          title="Could not load incident"
          description={error ?? "Incident not found"}
        />
      </div>
    );
  }

  const { incident, findings, actions, timeline } = data;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
          <Link href="/incidents">← Incidents</Link>
        </Button>
        <span className="text-muted-foreground">/</span>
        <span className="font-mono text-xs text-muted-foreground">
          {incident.id.slice(0, 8)}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-start gap-3">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
          <ImpactTag amount={incident.impact_amount} label={incident.impact_label} />
        </div>

        <div>
          <SectionLabel>Incident</SectionLabel>
          <h1 className="text-xl font-semibold tracking-tight">{incident.title}</h1>
        </div>

        {incident.affected_kpis && incident.affected_kpis.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {incident.affected_kpis.map((kpi) => (
              <span
                key={kpi}
                className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
              >
                {kpi}
              </span>
            ))}
          </div>
        )}

        {incident.root_cause && (
          <Card className="max-w-2xl shadow-card">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <SectionLabel>Root cause</SectionLabel>
                {incident.root_cause_confidence != null && (
                  <span className="font-mono text-xs text-primary">
                    {incident.root_cause_confidence}% confidence
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed text-foreground">{incident.root_cause}</p>
              {incident.root_cause_confidence != null && (
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${incident.root_cause_confidence}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {incident.monitoring_kpi != null &&
          incident.recovery_pct != null &&
          (incident.status === "monitoring" || incident.status === "resolved") && (
            <Card className="max-w-2xl shadow-card">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <SectionLabel>
                    Projected recovery · {incident.monitoring_kpi}
                  </SectionLabel>
                  <span className="font-mono text-xs text-sev-low">
                    {Math.round((incident.recovery_pct ?? 0) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-sev-low transition-all"
                    style={{
                      width: `${Math.round((incident.recovery_pct ?? 0) * 100)}%`,
                    }}
                  />
                </div>
                {incident.baseline_value != null && incident.target_value != null && (
                  <p className="font-mono text-xs text-muted-foreground">
                    baseline {Number(incident.baseline_value).toFixed(2)} → target{" "}
                    {Number(incident.target_value).toFixed(2)} (projected)
                  </p>
                )}
              </CardContent>
            </Card>
          )}

        {incident.status === "detected" && incident.affected_product && (
          <Button onClick={triggerInvestigation} disabled={investigating} size="sm">
            {investigating ? "Investigating…" : "Trigger investigation"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <SectionLabel className="mb-3 block">Agent findings</SectionLabel>
            {findings.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {findings.map((f) => (
                  <AgentFindingCard key={f.id} finding={f} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No findings yet"
                description="Trigger investigation to populate agent findings for this incident."
              />
            )}
          </section>

          <section>
            <SectionLabel className="mb-3 block">Proposed actions</SectionLabel>
            <ActionList
              actions={actions}
              incidentId={incident.id}
              onUpdate={handleActionsUpdate}
            />
          </section>
        </div>

        <section>
          <SectionLabel className="mb-3 block">Timeline</SectionLabel>
          <IncidentTimeline events={timeline} />
        </section>
      </div>
    </div>
  );
}
