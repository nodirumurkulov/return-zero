"use client";

import IncidentCard, { type Incident } from "./IncidentCard";
import StatusBadge from "@/components/ui/StatusBadge";

const COLUMNS: { status: string; label: string }[] = [
  { status: "detected",          label: "Detected" },
  { status: "investigating",     label: "Investigating" },
  { status: "fix_proposed",      label: "Fix Proposed" },
  { status: "awaiting_approval", label: "Awaiting Approval" },
  { status: "monitoring",        label: "Monitoring" },
  { status: "resolved",          label: "Resolved" },
];

export default function IncidentKanban({ incidents }: { incidents: Incident[] }) {
  const byStatus: Record<string, Incident[]> = {};
  COLUMNS.forEach((col) => {
    byStatus[col.status] = incidents.filter((i) => i.status === col.status);
  });

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-10rem)]">
      {COLUMNS.map((col) => {
        const cards = byStatus[col.status] ?? [];
        return (
          <div
            key={col.status}
            className="flex-shrink-0 w-72 flex flex-col"
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <StatusBadge status={col.status} />
              <span className="text-xs text-zinc-600 font-mono">
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3 flex-1">
              {cards.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
              {cards.length === 0 && (
                <div className="flex-1 border border-dashed border-zinc-800 rounded-lg flex items-center justify-center min-h-[80px]">
                  <span className="text-xs text-zinc-700">No incidents</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
