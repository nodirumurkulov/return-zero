"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Triggers the Phase-2 learn + report pass, then refreshes to show the report.
export function RunAnalysis({ label = "Run analysis" }: { label?: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "running" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setState("running");
    setMessage(null);
    try {
      const res = await fetch("/api/learn", { method: "POST" });
      const body = (await res.json()) as { success: boolean; error?: string };
      if (!res.ok || !body.success) throw new Error(body.error ?? "Analysis failed");
      router.refresh();
      setState("idle");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Analysis failed");
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={() => void run()} disabled={state === "running"}>
        {state === "running" ? "Analyzing your data…" : label}
      </Button>
      {message && <p className="text-sm text-destructive">{message}</p>}
    </div>
  );
}
