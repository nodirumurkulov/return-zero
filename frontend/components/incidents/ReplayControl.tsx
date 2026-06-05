"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// BYOD Phase 3 — step the replay clock forward; new incidents stream onto the
// board as the cursor crosses each product's learned threshold.
export function ReplayControl({ initialCursor }: { initialCursor: string | null }) {
  const router = useRouter();
  const [cursor, setCursor] = useState(initialCursor);
  const [state, setState] = useState<"idle" | "running" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const advance = async (days: number) => {
    setState("running");
    setMessage(null);
    try {
      const res = await fetch("/api/replay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ advance_days: days }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        error?: string;
        cursor?: string;
        created?: number;
        at_end?: boolean;
      };
      if (!res.ok || !body.success) throw new Error(body.error ?? "Replay failed");
      setCursor(body.cursor ?? cursor);
      setMessage(
        body.created
          ? `+${body.created} new incident${body.created === 1 ? "" : "s"}${body.at_end ? " · reached end of data" : ""}`
          : body.at_end
            ? "No new incidents · reached end of data"
            : "No new incidents this step",
      );
      router.refresh();
      setState("idle");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Replay failed");
    }
  };

  return (
    <div className="flex flex-col items-start gap-1 md:items-end">
      <div className="flex items-center gap-2">
        {cursor && (
          <span className="text-xs text-muted-foreground">
            Replay clock: <span className="font-medium text-foreground">{cursor}</span>
          </span>
        )}
        <Button variant="outline" onClick={() => void advance(7)} disabled={state === "running"}>
          {state === "running" ? "Advancing…" : "Advance 7 days"}
        </Button>
      </div>
      {message && (
        <p className={`text-xs ${state === "error" ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>
      )}
    </div>
  );
}
