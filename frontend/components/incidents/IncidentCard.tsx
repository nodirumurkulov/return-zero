import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Incident } from "@/lib/stores";

import { IncidentCardStatusMenu } from "./IncidentCardStatusMenu";

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
  interactive = true,
}: {
  incident: Incident;
  interactive?: boolean;
}) {
  return (
    <Card
      data-testid="incident-card"
      className="group gap-0 p-3 transition-[box-shadow,border-color] hover:shadow-pop"
    >
      <Link href={`/incidents/${incident.id}`} className="block space-y-1.5">
        <h3 className="text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {incident.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {timeAgo(incident.created_at)}
          {incident.impact_amount ? ` · ${gbp(incident.impact_amount)}` : ""}
        </p>
      </Link>
      {interactive ? (
        <div className="mt-2">
          <IncidentCardStatusMenu incident={incident} />
        </div>
      ) : null}
    </Card>
  );
}
