"use client";

import IncidentCard, { type Incident } from "./IncidentCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/empty-state";

const COLUMNS: { status: string; label: string }[] = [
  { status: "detected", label: "Detected" },
  { status: "investigating", label: "Investigating" },
  { status: "fix_proposed", label: "Fix Proposed" },
  { status: "awaiting_approval", label: "Awaiting Approval" },
  { status: "monitoring", label: "Monitoring" },
  { status: "resolved", label: "Resolved" },
];

export default function IncidentKanban({ incidents }: { incidents: Incident[] }) {
  const byStatus: Record<string, Incident[]> = {};
  COLUMNS.forEach((col) => {
    byStatus[col.status] = incidents.filter((i) => i.status === col.status);
  });

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
      {COLUMNS.map((col) => {
        const cards = byStatus[col.status] ?? [];
        return (
          <div key={col.status} className="flex w-72 shrink-0 flex-col">
            <div className="mb-3 flex items-center justify-between px-1">
              <StatusBadge status={col.status} />
              <span className="font-mono text-xs text-muted-foreground">{cards.length}</span>
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
