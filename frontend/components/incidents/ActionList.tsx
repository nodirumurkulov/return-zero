"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyDescription } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import type { IncidentAction } from "@/lib/incidents";
import { cn } from "@/lib/utils";

const impactColour: Record<string, string> = {
  high: "text-green-400",
  medium: "text-yellow-400",
  low: "text-zinc-500",
};

const riskColour: Record<string, string> = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

const statusStyle: Record<string, string> = {
  proposed: "bg-zinc-800 text-zinc-400 border-zinc-700",
  approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  deployed: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  monitoring: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

export default function ActionList({
  actions,
  incidentId,
}: {
  actions: IncidentAction[];
  incidentId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const proposed = actions.filter((a) => a.status === "proposed");

  async function approveAll() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve_all_low_risk: true }),
      });
      const json = (await res.json()) as { approved?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setMessage(`${json.approved} action(s) approved and deployed`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function approveOne(actionId: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_ids: [actionId] }),
      });
      const json = (await res.json()) as { approved?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setMessage("Action approved and deployed");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (actions.length === 0) {
    return (
      <EmptyDescription className="py-4 text-center">
        No actions proposed yet
      </EmptyDescription>
    );
  }

  return (
    <div className="space-y-3">
      {proposed.filter((a) => !a.auto_deploy && a.risk_level === "low").length > 0 && (
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs text-muted-foreground">
            {proposed.length} action(s) awaiting approval
          </span>
          <Button
            data-testid="approve-all-low-risk"
            size="sm"
            onClick={() => {
              void approveAll();
            }}
            disabled={loading}
          >
            {loading ? "Approving…" : "Approve all low-risk"}
          </Button>
        </div>
      )}

      {message ? (
        <Alert className="border-green-500/20 bg-green-500/10 text-green-400">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {actions.map((action, index) => (
        <div key={action.id}>
          {index > 0 ? <Separator className="my-3" /> : null}
          <Card size="sm" className="ring-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {action.title}
                    </span>
                    {action.auto_deploy ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30"
                      >
                        Auto-deploy
                      </Badge>
                    ) : null}
                  </div>
                  {action.description ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {action.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex gap-4 text-xs">
                    <span>
                      Impact:{" "}
                      <span
                        className={impactColour[action.impact_level] ?? "text-muted-foreground"}
                      >
                        {action.impact_level}
                      </span>
                    </span>
                    <span>
                      Risk:{" "}
                      <span
                        className={riskColour[action.risk_level] ?? "text-muted-foreground"}
                      >
                        {action.risk_level}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full text-[10px] font-medium",
                      statusStyle[action.status] ?? statusStyle.proposed,
                    )}
                  >
                    {action.status}
                  </Badge>
                  {action.status === "proposed" && !action.auto_deploy ? (
                    <Button
                      data-testid="approve-action"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        void approveOne(action.id);
                      }}
                      disabled={loading}
                    >
                      Approve
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
