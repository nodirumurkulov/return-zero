"use client";

import { Bot, Check, LoaderCircle, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { useInvestigationSteps } from "@/hooks/agents";
import type { InvestigationStepsResponse } from "@/lib/agents/schemas";

function StepIcon({ status }: { status: InvestigationStepsResponse["steps"][number]["status"] }) {
  if (status === "done") {
    return <Check className="size-3.5 text-sev-resolved" aria-hidden />;
  }
  if (status === "error") {
    return <X className="size-3.5 text-destructive" aria-hidden />;
  }
  return <LoaderCircle className="size-3.5 animate-spin text-primary" aria-hidden />;
}

export default function InvestigationLivePanel({
  incidentId,
  active,
  onSettled,
}: {
  incidentId: string;
  active: boolean;
  onSettled?: () => void;
}) {
  const snapshot = useInvestigationSteps({ incidentId, active, onSettled });

  if (!active) return null;

  const steps = snapshot?.steps ?? [];
  const runStatus = snapshot?.run_status ?? "running";
  const isLive = runStatus === "running";

  return (
    <Card className="gap-0 p-0" data-testid="investigation-live-panel">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Bot className="size-3.5" />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-foreground">Hugo is investigating</div>
          <div className="text-[11px] text-muted-foreground">
            Quant Analyst and Operator are working through this incident
          </div>
        </div>
        {isLive ? (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-sev-resolved">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-sev-resolved/50" />
              <span className="relative inline-flex size-2 rounded-full bg-sev-resolved" />
            </span>
            Live
          </span>
        ) : null}
      </div>

      <ul
        className="divide-y divide-border"
        aria-live="polite"
        aria-busy={isLive}
        data-testid="investigation-step-list"
      >
        {steps.length === 0 ? (
          <li className="flex items-center gap-3 px-4 py-3 text-[13px] text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin text-primary" aria-hidden />
            Starting investigation…
          </li>
        ) : (
          steps.map((step) => (
            <li key={step.id} className="flex items-start gap-3 px-4 py-2.5">
              <span className="mt-0.5 flex size-4 items-center justify-center">
                <StepIcon status={step.status} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-foreground">{step.label}</div>
                <div className="text-[11px] text-muted-foreground">{step.agent_name}</div>
              </div>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
