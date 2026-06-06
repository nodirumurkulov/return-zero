import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Incident } from "@/lib/incidents";

function formatImpact(amount: number | null) {
  if (amount == null) return null;
  return `£${Math.round(amount).toLocaleString("en-GB")}`;
}

export default function LinkedIncidents({ incidents }: { incidents: Incident[] }) {
  const openCount = incidents.filter((i) => i.status !== "resolved").length;

  return (
    <Card className="gap-0 p-0">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <AlertTriangle className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-foreground">Linked incidents</div>
          <div className="text-[11px] text-muted-foreground">
            {incidents.length === 0
              ? "No incidents linked to this product"
              : `${openCount} open · ${incidents.length} total`}
          </div>
        </div>
      </div>
      {incidents.length > 0 ? (
        <ul className="divide-y divide-border">
          {incidents.map((incident) => (
            <li key={incident.id}>
              <Link
                href={`/incidents/${incident.id}`}
                className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-[13px] font-medium leading-snug text-foreground">
                    {incident.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SeverityBadge severity={incident.severity} />
                    <StatusBadge status={incident.status} />
                    {formatImpact(incident.impact_amount) ? (
                      <span className="tabnum text-[11px] text-muted-foreground">
                        {formatImpact(incident.impact_amount)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
          Incidents tied to this product will appear here.
        </p>
      )}
    </Card>
  );
}
