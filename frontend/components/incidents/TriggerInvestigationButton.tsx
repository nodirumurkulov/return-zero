"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div>
      <button
        onClick={() => {
          void triggerInvestigation();
        }}
        disabled={investigating}
        className="mt-4 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white disabled:opacity-50 transition-colors"
      >
        {investigating ? "Investigating…" : "Trigger Investigation"}
      </button>
      {error && <p className="mt-2 text-xs text-red-400 font-mono">{error}</p>}
    </div>
  );
}
