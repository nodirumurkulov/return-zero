import type { Incident } from "@/components/incidents/IncidentCard";
import IncidentKanban from "@/components/incidents/IncidentKanban";
import { EmptyState } from "@/components/ui/empty-state";
import SectionLabel from "@/components/ui/section-label";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const supabase = createServiceClient();

  const { data: incidents, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          title="Failed to load incidents"
          description={error.message}
        />
      </div>
    );
  }

  const rows = (incidents ?? []) as unknown as Incident[];
  const totalImpact = rows.reduce((sum, i) => sum + (Number(i.impact_amount) || 0), 0);
  const open = rows.filter((i) => i.status !== "resolved").length;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionLabel>Incident command center</SectionLabel>
          <h1 className="text-xl font-semibold tracking-tight">Open incidents</h1>
          <p className="text-sm text-muted-foreground">
            {open} open · £{totalImpact.toLocaleString("en-GB")} total exposure
          </p>
        </div>
      </div>

      <IncidentKanban incidents={rows} />
    </div>
  );
}
