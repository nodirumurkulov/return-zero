import IncidentCard from "@/components/incidents/IncidentCard";
import { CatalogHealthPanel } from "@/components/marketing/CatalogHealthPanel";
import {
  MARKETING_COURT_TRAINER,
  MARKETING_HERO_INCIDENTS,
} from "@/components/marketing/fixtures/demo-data";
import { SectionLabel } from "@/components/ui/section-label";
import { SeverityBadge } from "@/components/ui/SeverityBadge";

export function ProductHeroFrame() {
  const lead = MARKETING_HERO_INCIDENTS[0];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted/20 shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <SectionLabel>Incidents</SectionLabel>
          <span className="tabnum text-xs text-muted-foreground">
            {MARKETING_HERO_INCIDENTS.length} open
          </span>
        </div>
        <SeverityBadge severity={lead.severity} />
      </div>

      <div className="space-y-3 p-4">
        {MARKETING_HERO_INCIDENTS.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} interactive={false} />
        ))}
        <CatalogHealthPanel product={MARKETING_COURT_TRAINER} health="critical" />
      </div>
    </div>
  );
}
