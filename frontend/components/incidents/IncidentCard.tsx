"use client";

import Link from "next/link";
import SeverityBadge from "@/components/ui/SeverityBadge";
import ImpactTag from "@/components/ui/ImpactTag";

export type Incident = {
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
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <Link href={`/incidents/${incident.id}`}>
      <div className="group bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <SeverityBadge severity={incident.severity} />
          <span className="text-xs text-zinc-500 shrink-0">
            {timeAgo(incident.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-zinc-100 leading-snug mb-2 group-hover:text-white transition-colors">
          {incident.title}
        </h3>

        {/* Impact */}
        <div className="mb-3">
          <ImpactTag amount={incident.impact_amount} label={incident.impact_label} />
        </div>

        {/* Root cause snippet */}
        {incident.root_cause && (
          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">
            {incident.root_cause}
          </p>
        )}

        {/* KPIs */}
        {incident.affected_kpis && incident.affected_kpis.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {incident.affected_kpis.slice(0, 3).map((kpi) => (
              <span
                key={kpi}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono"
              >
                {kpi}
              </span>
            ))}
          </div>
        )}

        {/* Confidence */}
        {incident.root_cause_confidence != null && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${incident.root_cause_confidence}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              {incident.root_cause_confidence}% confidence
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
