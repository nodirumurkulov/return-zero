"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, CircleCheckBig } from "lucide-react";
import Link from "next/link";
import ActionList from "@/components/incidents/ActionList";
import AgentFindingCard from "@/components/incidents/AgentFindingCard";
import IncidentTimeline from "@/components/incidents/IncidentTimeline";
import TriggerInvestigationButton from "@/components/incidents/TriggerInvestigationButton";
import { Card } from "@/components/ui/card";
import { ConfidenceBar } from "@/components/ui/confidence-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ImpactTag } from "@/components/ui/ImpactTag";
import { SectionLabel } from "@/components/ui/section-label";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getIncidentDetailClientQueryOptions } from "@/lib/incidents/api";

export default function IncidentDetailView({ incidentId }: { incidentId: string }) {
  const incidentRef = { id: incidentId };
  const { data: detail, isError, error, isPending } = useQuery(
    getIncidentDetailClientQueryOptions(incidentRef),
  );

  if (isPending && !detail) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading incident…</p>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="p-6">
        <EmptyState
          title="Failed to load incident"
          description={error instanceof Error ? error.message : "Unknown error"}
        />
      </div>
    );
  }

  const { incident, findings, actions, timeline } = detail;
  const recoveryPct = incident.recovery_pct != null ? Math.round(incident.recovery_pct * 100) : null;
  const showRecovery =
    incident.monitoring_kpi != null &&
    recoveryPct != null &&
    (incident.status === "monitoring" || incident.status === "resolved");

  return (
    <div className="flex h-full flex-col">
      {/* Header band */}
      <div className="border-b border-border bg-card px-6 py-3.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/incidents" className="hover:text-foreground">
            Incidents
          </Link>
          <ChevronRight className="size-3" />
          <span className="tabnum font-mono">{incident.id.slice(0, 8)}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
              {incident.title}
            </h1>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
            <ImpactTag amount={incident.impact_amount} label={incident.impact_label} />
          </div>
          {incident.status === "detected" && incident.affected_product ? (
            <TriggerInvestigationButton incidentId={incident.id} productId={incident.affected_product} />
          ) : null}
        </div>
        {incident.affected_kpis && incident.affected_kpis.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {incident.affected_kpis.map((kpi) => (
              <span key={kpi} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {kpi}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="mx-auto max-w-[1040px] p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Main column */}
            <div className="space-y-5">
              {incident.root_cause ? (
                <Card className="gap-0 p-5">
                  <div className="flex items-center gap-1.5">
                    <CircleCheckBig className="size-4 text-sev-resolved" />
                    <SectionLabel>
                      Root cause
                      {incident.root_cause_confidence != null
                        ? ` · ${incident.root_cause_confidence}% confidence`
                        : ""}
                    </SectionLabel>
                  </div>
                  <p className="mt-2 text-[15px] font-semibold leading-snug text-foreground [text-wrap:pretty]">
                    {incident.root_cause}
                  </p>
                  {incident.root_cause_confidence != null ? (
                    <div className="mt-3">
                      <ConfidenceBar value={incident.root_cause_confidence} />
                    </div>
                  ) : null}
                </Card>
              ) : null}

              <section>
                <SectionLabel className="mb-3">Agent findings</SectionLabel>
                {findings.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
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
                <SectionLabel className="mb-3">Recommended actions</SectionLabel>
                <ActionList actions={actions} incidentId={incident.id} />
              </section>
            </div>

            {/* Rail */}
            <div className="space-y-5">
              {showRecovery ? (
                <Card className="gap-0 p-4">
                  <div className="flex items-center justify-between">
                    <SectionLabel>Projected recovery</SectionLabel>
                    <span className="tabnum text-[11px] font-medium text-sev-resolved">{recoveryPct}%</span>
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">{incident.monitoring_kpi}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-sev-resolved transition-all"
                      style={{ width: `${recoveryPct}%` }}
                    />
                  </div>
                  {incident.baseline_value != null && incident.target_value != null ? (
                    <p className="mt-2 tabnum text-[11px] text-muted-foreground">
                      baseline {Number(incident.baseline_value).toFixed(2)} → target{" "}
                      {Number(incident.target_value).toFixed(2)}
                    </p>
                  ) : null}
                </Card>
              ) : null}

              <Card className="gap-0 p-4">
                <SectionLabel className="mb-3">Timeline</SectionLabel>
                <IncidentTimeline events={timeline} />
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
