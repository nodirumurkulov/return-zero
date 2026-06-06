"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTriggerInvestigation } from "@/hooks/agents";

export default function TriggerInvestigationButton({
  incidentId,
  productId,
}: {
  incidentId: string;
  productId: string;
}) {
  const investigate = useTriggerInvestigation({ id: incidentId });

  function runInvestigation() {
    investigate.mutate({ product: { id: productId } });
  }

  const error =
    investigate.error instanceof Error ? investigate.error.message : null;

  return (
    <div className="mt-4 space-y-2">
      <Button
        onClick={() => {
          runInvestigation();
        }}
        disabled={investigate.isPending}
        aria-busy={investigate.isPending}
      >
        {investigate.isPending ? "Investigating…" : "Trigger Investigation"}
      </Button>
      {error ? (
        <Alert variant="destructive" role="alert" aria-live="polite">
          <AlertDescription className="font-mono text-xs">{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
