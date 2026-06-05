"use client";

import { ArrowRight, Bot, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfidenceBar } from "@/components/ui/confidence-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { INCIDENT_STATUSES, type Incident } from "@/lib/incidents";
import { useUpdateIncidentStatus } from "@/lib/incidents/hooks";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function gbp(n: number) {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

export default function IncidentCard({
  incident,
  editable = false,
}: {
  incident: Incident;
  editable?: boolean;
}) {
  const updateStatus = useUpdateIncidentStatus();

  function changeStatus(status: string) {
    updateStatus.mutate({ incident: { id: incident.id }, status: { value: status } });
  }

  return (
    <Card
      data-testid="incident-card"
      className="group gap-0 p-3 transition-[box-shadow,border-color] hover:shadow-pop"
    >
      <div className="flex items-start justify-between gap-2">
        <SeverityBadge severity={incident.severity} />
        <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(incident.created_at)}</span>
      </div>

      <Link href={`/incidents/${incident.id}`}>
        <h3 className="mt-2 text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {incident.title}
        </h3>
      </Link>

      {incident.impact_amount ? (
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="tabnum text-base font-semibold text-foreground">{gbp(incident.impact_amount)}</span>
          {incident.impact_label ? (
            <span className="text-[11px] text-muted-foreground">{incident.impact_label}</span>
          ) : null}
        </div>
      ) : null}

      {incident.affected_kpis && incident.affected_kpis.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {incident.affected_kpis.slice(0, 3).map((kpi) => (
            <span
              key={kpi}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {kpi}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-2.5">
        <Avatar className="size-5">
          <AvatarFallback className="bg-primary-subtle text-primary">
            <Bot className="size-3" />
          </AvatarFallback>
        </Avatar>
        <span className="text-[11px] text-muted-foreground">Hugo</span>
        {incident.root_cause ? (
          <span className="ml-auto inline-flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
            <ArrowRight className="size-3 shrink-0" />
            <span className="truncate">{incident.root_cause}</span>
          </span>
        ) : null}
      </div>

      {incident.root_cause_confidence != null ? (
        <div className="mt-2.5">
          <ConfidenceBar value={incident.root_cause_confidence} />
        </div>
      ) : null}

      {editable ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-testid="incident-status-trigger"
              variant="outline"
              size="sm"
              className="mt-3 w-full justify-between"
              disabled={updateStatus.isPending}
            >
              <StatusBadge status={incident.status} />
              <ChevronDown className="size-4 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {INCIDENT_STATUSES.map((status) => (
              <DropdownMenuItem key={status} onClick={() => changeStatus(status)}>
                <StatusBadge status={status} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </Card>
  );
}
