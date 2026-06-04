"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { updateIncidentStatus } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ImpactTag from "@/components/ui/ImpactTag";
import SeverityBadge from "@/components/ui/SeverityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import type { Incident } from "@/lib/incidents";

export type { Incident } from "@/lib/incidents";

const STATUSES = [
  "detected",
  "investigating",
  "fix_proposed",
  "awaiting_approval",
  "deploying",
  "monitoring",
  "resolved",
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function IncidentCard({
  incident,
  editable = false,
}: {
  incident: Incident;
  editable?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function changeStatus(status: string) {
    startTransition(async () => {
      await updateIncidentStatus(incident.id, status);
    });
  }

  return (
    <div className="group rounded-lg border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/30">
      <div className="mb-3 flex items-start justify-between gap-2">
        <SeverityBadge severity={incident.severity} />
        <span className="shrink-0 text-xs text-muted-foreground">
          {timeAgo(incident.created_at)}
        </span>
      </div>

      <Link href={`/incidents/${incident.id}`}>
        <h3 className="mb-2 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
          {incident.title}
        </h3>
      </Link>

      <div className="mb-3">
        <ImpactTag amount={incident.impact_amount} label={incident.impact_label} />
      </div>

      {incident.root_cause && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {incident.root_cause}
        </p>
      )}

      {incident.affected_kpis && incident.affected_kpis.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {incident.affected_kpis.slice(0, 3).map((kpi) => (
            <span
              key={kpi}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {kpi}
            </span>
          ))}
        </div>
      )}

      {editable ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              disabled={pending}
            >
              <StatusBadge status={incident.status} />
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {STATUSES.map((status) => (
              <DropdownMenuItem key={status} onClick={() => changeStatus(status)}>
                <StatusBadge status={status} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        incident.root_cause_confidence != null && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${incident.root_cause_confidence}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {incident.root_cause_confidence}% confidence
            </span>
          </div>
        )
      )}
    </div>
  );
}
