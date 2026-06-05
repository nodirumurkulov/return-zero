import IncidentKanban from "@/components/incidents/IncidentKanban";
import { ReplayControl } from "@/components/incidents/ReplayControl";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/ui/section-label";
import { listIncidents } from "@/lib/incidents";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const supabase = await createClient();

  const result = await listIncidents(supabase).then(
    (rows) => ({ ok: true as const, rows }),
    (err: unknown) => ({
      ok: false as const,
      message: err instanceof Error ? err.message : "Failed to load incidents",
    }),
  );

  if (!result.ok) {
    return (
      <div className="p-6">
        <EmptyState title="Failed to load incidents" description={result.message} />
      </div>
    );
  }

  const { rows } = result;
  const totalImpact = rows.reduce((sum, i) => sum + (Number(i.impact_amount) || 0), 0);
  const open = rows.filter((i) => i.status !== "resolved").length;

  // Replay cursor (defensive: null if the replay_state table isn't present yet).
  const { data: replay } = await supabase
    .from("replay_state")
    .select("cursor")
    .eq("id", true)
    .maybeSingle();
  const replayCursor = replay?.cursor ? String(replay.cursor).slice(0, 10) : null;

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
        <ReplayControl initialCursor={replayCursor} />
      </div>

      <IncidentKanban incidents={rows} />
    </div>
  );
}
