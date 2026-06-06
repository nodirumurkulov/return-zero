"use client";

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
import type { IncidentDetail } from "@/lib/stores";

export default function IncidentDetailView({ detail }: { detail: IncidentDetail }) {
  const { incident, findings, actions, timeline } = detail;

  return (
    <div className="flex h-full flex-col">
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
          {incident.status === "detected" && incident.product_id ? (
            <TriggerInvestigationButton incidentId={incident.id} productId={incident.product_id} />
          ) : null}
        </div>
        {incident.affected_kpi_keys.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {incident.affected_kpi_keys.map((kpi) => (
              <span key={kpi} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {kpi}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-auto bg-muted/30">
        <div className="mx-auto max-w-[1040px] p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
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
                    description="Investigation runs automatically after a breach is detected. Use the button above to retry."
                  />
                )}
              </section>

              <section>
                <SectionLabel className="mb-3">Recommended actions</SectionLabel>
                <ActionList actions={actions} incidentId={incident.id} />
              </section>
            </div>

            <div className="space-y-5">
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
