"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type IncidentAction = {
  id: string;
  title: string;
  description?: string;
  impact_level: string;
  risk_level: string;
  auto_deploy: boolean;
  status: string;
  approved_by?: string;
  approved_at?: string;
  deployed_at?: string;
};

const impactColour: Record<string, string> = {
  high: "text-sev-low",
  medium: "text-yellow-400",
  low: "text-muted-foreground",
};

const riskColour: Record<string, string> = {
  high: "text-sev-critical",
  medium: "text-yellow-400",
  low: "text-sev-low",
};

const statusStyle: Record<string, string> = {
  proposed: "bg-muted text-muted-foreground border border-border",
  approved: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  deployed: "bg-green-500/20 text-green-400 border border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
  monitoring: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
};

export default function ActionList({
  actions,
  incidentId,
  onUpdate,
}: {
  actions: IncidentAction[];
  incidentId: string;
  onUpdate?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const proposed = actions.filter((a) => a.status === "proposed");

  async function approveAll() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve_all_low_risk: true, approved_by: "operator" }),
      });
      const json = (await res.json()) as { approved?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setMessage(`${json.approved ?? 0} action(s) approved and deployed`);
      onUpdate?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function approveOne(actionId: string) {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_ids: [actionId], approved_by: "operator" }),
      });
      const json = (await res.json()) as { approved?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setMessage("Action approved and deployed");
      onUpdate?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {proposed.filter((a) => !a.auto_deploy && a.risk_level === "low").length > 0 && (
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="text-xs text-muted-foreground">
            {proposed.length} action(s) awaiting approval
          </span>
          <Button onClick={approveAll} disabled={loading} size="sm" variant="secondary">
            {loading ? "Approving…" : "Approve all low-risk"}
          </Button>
        </div>
      )}

      {message && (
        <p className="rounded-md border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-400">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {actions.map((action) => (
        <Card key={action.id} className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{action.title}</span>
                  {action.auto_deploy && (
                    <span className="rounded border border-blue-500/30 bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-400">
                      Auto-deploy
                    </span>
                  )}
                </div>
                {action.description && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {action.description}
                  </p>
                )}
                <div className="mt-2 flex gap-4 text-xs">
                  <span>
                    Impact:{" "}
                    <span className={impactColour[action.impact_level] ?? "text-muted-foreground"}>
                      {action.impact_level}
                    </span>
                  </span>
                  <span>
                    Risk:{" "}
                    <span className={riskColour[action.risk_level] ?? "text-muted-foreground"}>
                      {action.risk_level}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle[action.status] ?? statusStyle.proposed}`}
                >
                  {action.status}
                </span>
                {action.status === "proposed" && !action.auto_deploy && (
                  <Button
                    onClick={() => approveOne(action.id)}
                    disabled={loading}
                    size="sm"
                    variant="outline"
                  >
                    Approve
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {actions.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">No actions proposed yet</p>
      )}
    </div>
  );
}
