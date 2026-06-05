"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyDescription } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { useApproveActions } from "@/hooks/stores/incidents";
import { cn } from "@/lib/utils";
import type { IncidentAction } from "@/types/incidents";

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

const confidenceStyle: Record<string, string> = {
  high: "border-sev-resolvedBd bg-sev-resolvedBg text-sev-resolved",
  moderate: "border-sev-monitorBd bg-sev-monitorBg text-sev-monitor",
  low: "border-sev-criticalBd bg-sev-criticalBg text-sev-critical",
  none: "border-border bg-muted text-muted-foreground",
};

/**
 * The Operator folds extras into the action description (incident_actions has no
 * JSON column): an optional "Why: …" rationale line and a trailing
 * "Est. impact: £X · Confidence: y" line. Lift them back out for display.
 */
function parseDescription(raw: string | null): {
  body: string;
  rationale: string | null;
  impactGbp: string | null;
  confidence: string | null;
} {
  if (!raw) return { body: "", rationale: null, impactGbp: null, confidence: null };
  const lines = raw.split("\n");
  const rationale =
    lines.find((l) => l.startsWith("Why: "))?.slice(5).trim() ?? null;
  const metaLine = lines.find(
    (l) => /Est\. impact: £[\d,]+/.test(l) || /Confidence: (high|moderate|low|none)/.test(l),
  );
  const impactGbp = metaLine?.match(/Est\. impact: £([\d,]+)/)?.[1] ?? null;
  const confidence = metaLine?.match(/Confidence: (high|moderate|low|none)/)?.[1] ?? null;
  const body = lines
    .filter((l) => l !== metaLine && !l.startsWith("Why: "))
    .join("\n")
    .trim();
  return { body, rationale, impactGbp, confidence };
}

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
            data-testid="approve-all-low-risk"
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
                  {(() => {
                    const parsed = parseDescription(action.description);
                    return (
                      <>
                        {parsed.body ? (
                          <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                            {parsed.body}
                          </p>
                        ) : null}
                        {parsed.rationale ? (
                          <p className="mt-1.5 text-xs leading-relaxed text-foreground/80">
                            <span className="font-medium">Why:</span> {parsed.rationale}
                          </p>
                        ) : null}
                        {parsed.impactGbp || parsed.confidence ? (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {parsed.impactGbp ? (
                              <span className="tabnum rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                ~£{parsed.impactGbp}
                              </span>
                            ) : null}
                            {parsed.confidence ? (
                              <span
                                className={cn(
                                  "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                                  confidenceStyle[parsed.confidence] ?? confidenceStyle.none,
                                )}
                              >
                                {parsed.confidence} confidence
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    );
                  })()}
                  <div className="mt-2 flex gap-4 text-xs">
                    <span>
                      Impact:{" "}
                      <span
                        className={
                          action.impact_level != null
                            ? (impactColour[action.impact_level] ?? "text-muted-foreground")
                            : "text-muted-foreground"
                        }
                      >
                        {action.impact_level}
                      </span>
                    </span>
                    <span>
                      Risk:{" "}
                      <span
                        className={
                          action.risk_level != null
                            ? (riskColour[action.risk_level] ?? "text-muted-foreground")
                            : "text-muted-foreground"
                        }
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
