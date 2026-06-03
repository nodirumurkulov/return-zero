import { createServiceClient } from "@/lib/supabase/server";
import IncidentKanban from "@/components/incidents/IncidentKanban";
import type { Incident } from "@/components/incidents/IncidentCard";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const supabase = createServiceClient();

  const { data: incidents, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-red-400 text-sm font-mono">
          Failed to load incidents: {error.message}
        </p>
      </div>
    );
  }

  const totalImpact = (incidents ?? []).reduce(
    (sum, i) => sum + (Number(i.impact_amount) || 0),
    0
  );
  const open = (incidents ?? []).filter((i) => i.status !== "resolved").length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Top bar */}
      <div className="border-b border-zinc-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Resolve
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Commerce Incident Response
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <div>
              <span className="text-zinc-200 font-mono text-sm font-semibold">
                {open}
              </span>{" "}
              open
            </div>
            <div>
              <span className="text-red-400 font-mono text-sm font-semibold">
                £{totalImpact.toLocaleString("en-GB")}
              </span>{" "}
              total exposure
            </div>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <div className="px-6 py-6">
        <IncidentKanban incidents={(incidents ?? []) as unknown as Incident[]} />
      </div>
    </div>
  );
}
