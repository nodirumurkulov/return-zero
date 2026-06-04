"use client";

import { useTriggerInvestigation } from "@/lib/agents/use-trigger-investigation";

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
    <div>
      <button
        onClick={() => {
          runInvestigation();
        }}
        disabled={investigate.isPending}
        className="mt-4 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white disabled:opacity-50 transition-colors"
      >
        {investigate.isPending ? "Investigating…" : "Trigger Investigation"}
      </button>
      {error && <p className="mt-2 text-xs text-red-400 font-mono">{error}</p>}
    </div>
  );
}
