"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function TriggerInvestigationButton({
  incidentId,
  productId,
}: {
  incidentId: string;
  productId: string;
}) {
  const router = useRouter();
  const [investigating, setInvestigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function triggerInvestigation() {
    setInvestigating(true);
    setError(null);
    try {
      const res = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident_id: incidentId, product_id: productId }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Investigation failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setInvestigating(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <Button
        onClick={() => {
          void triggerInvestigation();
        }}
        disabled={investigating}
      >
        {investigating ? "Investigating…" : "Trigger Investigation"}
      </Button>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription className="font-mono text-xs">{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
