"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KANBAN_COLUMNS, type Incident } from "@/lib/incidents";
import IncidentCard from "./IncidentCard";

const KANBAN_STATUS_SET = new Set<string>(KANBAN_COLUMNS.map((col) => col.status));

const COL_ACCENT: Record<string, string> = {
  detected: "bg-sev-idle",
  investigating: "bg-sev-high",
  fix_proposed: "bg-primary",
  awaiting_approval: "bg-sev-monitor",
  deploying: "bg-sev-high",
  monitoring: "bg-sev-monitor",
  resolved: "bg-sev-resolved",
};

export default function IncidentKanban({ incidents }: { incidents: Incident[] }) {
  const byStatus: Record<string, Incident[]> = {};
  KANBAN_COLUMNS.forEach((col) => {
    byStatus[col.status] = incidents.filter((i) => i.status === col.status);
  });

  const otherIncidents = incidents.filter((i) => !KANBAN_STATUS_SET.has(i.status));
  const columns: { status: string; label: string }[] = otherIncidents.length
    ? [...KANBAN_COLUMNS, { status: "__other__", label: "Other" }]
    : [...KANBAN_COLUMNS];
  byStatus.__other__ = otherIncidents;

  if (incidents.length === 0) {
    return (
      <EmptyState
        title="No incidents yet"
        description="When KPI monitors detect anomalies, incidents will appear here automatically."
      />
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const cards = byStatus[col.status] ?? [];
        return (
          <div key={col.status} className="flex w-72 shrink-0 flex-col">
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={`size-2 shrink-0 rounded-full ${COL_ACCENT[col.status] ?? "bg-zinc-300"}`} />
              {col.status === "__other__" ? (
                <span className="text-xs font-medium text-muted-foreground">{col.label}</span>
              ) : (
                <StatusBadge status={col.status} />
              )}
              <span className="tabnum ml-auto rounded-md bg-muted px-1.5 text-xs text-muted-foreground">
                {cards.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              {cards.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} editable />
              ))}
              {cards.length === 0 && (
                <div className="flex min-h-[80px] flex-1 items-center justify-center rounded-lg border border-dashed border-border">
                  <span className="text-xs text-muted-foreground">No incidents</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
