import AgentFindingCard from "@/components/incidents/AgentFindingCard";
import IncidentCard from "@/components/incidents/IncidentCard";
import {
  MARKETING_FINDINGS,
  MARKETING_KANBAN_INCIDENTS,
} from "@/components/marketing/fixtures/demo-data";
import { ConfidenceBar } from "@/components/ui/confidence-bar";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function MarketingKanbanPreview() {
  const column = MARKETING_KANBAN_INCIDENTS.filter((i) => i.status === "investigating");
  const other = MARKETING_KANBAN_INCIDENTS.filter((i) => i.status !== "investigating");

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="size-2 shrink-0 rounded-full bg-sev-high" aria-hidden />
        <StatusBadge status="investigating" />
        <span className="tabnum ml-auto rounded-md bg-muted px-1.5 text-xs text-muted-foreground">
          {column.length}
        </span>
      </div>
      <div className="space-y-3 p-4">
        {column.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
        {other.slice(0, 1).map((incident) => (
          <div key={incident.id} className="opacity-80">
            <div className="mb-2 flex items-center gap-2">
              <StatusBadge status={incident.status} />
            </div>
            <IncidentCard incident={incident} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InvestigationPreview() {
  const incident = MARKETING_KANBAN_INCIDENTS[0];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="space-y-1 border-b border-border px-4 py-3">
        <SectionLabel>Investigation</SectionLabel>
        <p className="text-[13px] font-semibold">{incident.title}</p>
        {incident.root_cause ? (
          <p className="text-xs text-muted-foreground">{incident.root_cause}</p>
        ) : null}
        {incident.root_cause_confidence != null ? (
          <ConfidenceBar value={incident.root_cause_confidence} className="mt-2 max-w-xs" />
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        <SectionLabel>Agent findings</SectionLabel>
        {MARKETING_FINDINGS.map((finding) => (
          <AgentFindingCard key={finding.id} finding={finding} />
        ))}
      </div>
    </div>
  );
}
