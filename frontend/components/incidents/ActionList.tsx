"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyDescription } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import type { IncidentAction } from "@/lib/incidents";
import { useApproveActions } from "@/lib/incidents/hooks";
import { cn } from "@/lib/utils";

const impactColour: Record<string, string> = {
  high: "text-sev-resolved",
  medium: "text-sev-monitor",
  low: "text-muted-foreground",
};

const riskColour: Record<string, string> = {
  high: "text-sev-critical",
  medium: "text-sev-monitor",
  low: "text-sev-resolved",
};

const statusStyle: Record<string, string> = {
  proposed: "bg-muted text-muted-foreground border-border",
  approved: "bg-primary-subtle text-primary border-primary/20",
  deployed: "bg-sev-resolvedBg text-sev-resolved border-sev-resolvedBd",
  rejected: "bg-sev-criticalBg text-sev-critical border-sev-criticalBd",
  monitoring: "bg-sev-monitorBg text-sev-monitor border-sev-monitorBd",
};

export default function ActionList({
  actions,
  incidentId,
}: {
  actions: IncidentAction[];
  incidentId: string;
}) {
  const approve = useApproveActions({ id: incidentId });
  const [message, setMessage] = useState<string | null>(null);

  const proposed = actions.filter((a) => a.status === "proposed");
  const loading = approve.isPending;

  function approveAll() {
    setMessage(null);
    approve.mutate(
      { approval: { kind: "all_low_risk" } },
      {
        onSuccess: (data) => {
          setMessage(`${data.approval.approvedCount} action(s) approved and deployed`);
        },
        onError: (err) => {
          setMessage(err instanceof Error ? err.message : "Error");
        },
      },
    );
  }

  function approveOne(actionId: string) {
    setMessage(null);
    approve.mutate(
      { approval: { kind: "action_ids", actionIds: [actionId] } },
      {
        onSuccess: () => {
          setMessage("Action approved and deployed");
        },
        onError: (err) => {
          setMessage(err instanceof Error ? err.message : "Error");
        },
      },
    );
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
            size="sm"
            onClick={() => {
              approveAll();
            }}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Approving…" : "Approve all low-risk"}
          </Button>
        </div>
      )}

      {message ? (
        <Alert
          className="border-sev-resolvedBd bg-sev-resolvedBg text-sev-resolved"
          role="status"
          aria-live="polite"
        >
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
                        className="border-primary/20 bg-primary-subtle text-[10px] text-primary"
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
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        approveOne(action.id);
                      }}
                      disabled={loading}
                      aria-busy={loading}
                      aria-label={`Approve action: ${action.title}`}
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
