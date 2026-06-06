"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// Survives router.refresh() remount so replay feedback stays visible in the UI and E2E.
const replayMessageCache = { pending: null as string | null };

// BYOD Phase 3 — step the replay clock forward; new incidents stream onto the
// board as the cursor crosses each product's learned threshold.
export function ReplayControl({ initialCursor }: { initialCursor: string | null }) {
  const router = useRouter();
  const [cursor, setCursor] = useState(initialCursor);
  const [state, setState] = useState<"idle" | "running" | "error">("idle");
  const [message, setMessage] = useState<string | null>(() => replayMessageCache.pending);

  useEffect(() => {
    replayMessageCache.pending = null;
  }, []);

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
      const statusMessage = body.created
        ? `+${body.created} new incident${body.created === 1 ? "" : "s"}${body.at_end ? " · reached end of data" : ""}`
        : body.at_end
          ? "No new incidents · reached end of data"
          : "No new incidents this step";
      replayMessageCache.pending = statusMessage;
      setMessage(statusMessage);
      setState("idle");
      router.refresh();
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
