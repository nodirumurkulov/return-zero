"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdvanceReplay } from "@/hooks/stores/analytics/replay";

export function ReplayControl({ initialCursor }: { initialCursor: string | null }) {
  const router = useRouter();
  const advanceReplay = useAdvanceReplay();
  const [cursor, setCursor] = useState(initialCursor);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const advance = async (days: number) => {
    setMessage(null);
    setIsError(false);
    try {
      const body = await advanceReplay.mutateAsync({ advanceDays: days });
      setCursor(body.cursor?.slice(0, 10) ?? cursor);
      setMessage(
        body.created
          ? `+${body.created} new incident${body.created === 1 ? "" : "s"}${body.atEnd ? " · reached end of data" : ""}`
          : body.atEnd
            ? "No new incidents · reached end of data"
            : "No new incidents this step",
      );
      router.refresh();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Replay failed");
    }
  };

  const state = advanceReplay.isPending ? "running" : isError ? "error" : "idle";

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
