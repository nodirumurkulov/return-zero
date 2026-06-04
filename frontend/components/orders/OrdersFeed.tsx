"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { OrderRow } from "@/components/orders/OrderRow";
import { Button } from "@/components/ui/button";
import type { OrderFeedItem } from "@/lib/orders/types";

interface OrderEntry {
  kind: "order";
  order: OrderFeedItem;
}
interface MarkerEntry {
  kind: "marker";
  id: string;
  cursor: string;
  incidents: { title: string; severity: string }[];
}
type Entry = OrderEntry | MarkerEntry;

const TICK_MS = 450;
const MAX_ENTRIES = 300;
const PAGE = 60;
const SPEEDS = [
  { label: "1×", value: 1 },
  { label: "8×", value: 8 },
  { label: "Turbo", value: 25 },
];

const dayOf = (iso: string): string => iso.slice(0, 10);

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function daysBetween(from: string, to: string): number {
  const ms = new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

export function OrdersFeed({
  startDate,
  dataEnd,
  initialOrders,
}: {
  startDate: string;
  dataEnd: string | null;
  initialOrders: OrderFeedItem[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(8);
  const [clock, setClock] = useState(startDate);
  const [busy, setBusy] = useState(false);

  const bufferRef = useRef<OrderFeedItem[]>([...initialOrders]);
  const seenRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.order_id)));
  const playheadRef = useRef<string>(`${startDate}T00:00:00Z`);
  const checkpointDayRef = useRef<string>(startDate);
  const fetchingRef = useRef(false);
  const lockRef = useRef(false); // a checkpoint is in flight
  const atEndRef = useRef(false);
  const alignedRef = useRef(false);

  const speedRef = useRef(speed);
  const playingRef = useRef(playing);
  useEffect(() => {
    speedRef.current = speed;
    playingRef.current = playing;
  }, [speed, playing]);

  const prepend = useCallback((next: Entry[]) => {
    setEntries((prev) => [...next, ...prev].slice(0, MAX_ENTRIES));
  }, []);

  // Fetch the next page of orders after the playhead, de-duped against seen.
  const fetchMore = useCallback(async (): Promise<OrderFeedItem[]> => {
    if (fetchingRef.current || atEndRef.current) return [];
    fetchingRef.current = true;
    try {
      const res = await fetch(`/api/orders?after=${encodeURIComponent(playheadRef.current)}&limit=${PAGE}`);
      if (!res.ok) return [];
      const body = (await res.json()) as { orders: OrderFeedItem[] };
      const fresh = body.orders.filter((o) => !seenRef.current.has(o.order_id));
      fresh.forEach((o) => seenRef.current.add(o.order_id));
      if (fresh.length === 0) atEndRef.current = true;
      return fresh;
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // Day-boundary checkpoint: advance the replay clock and surface new incidents.
  const runCheckpoint = useCallback(
    async (advanceDays: number) => {
      lockRef.current = true;
      setBusy(true);
      try {
        const res = await fetch("/api/replay", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ advance_days: advanceDays }),
        });
        const body = (await res.json()) as {
          cursor?: string;
          at_end?: boolean;
          breaches?: { created: { title: string; severity: string }[] };
          forecast?: { created: { title: string; severity: string }[] };
        };
        const incidents = [...(body.breaches?.created ?? []), ...(body.forecast?.created ?? [])];
        const cursor = body.cursor ?? checkpointDayRef.current;
        checkpointDayRef.current = cursor;
        setClock(cursor);
        if (incidents.length > 0) {
          prepend([{ kind: "marker", id: `m-${cursor}-${incidents.length}`, cursor, incidents }]);
          router.refresh();
        }
      } finally {
        lockRef.current = false;
        setBusy(false);
      }
    },
    [prepend, router],
  );

  const resetFeedState = useCallback(() => {
    setEntries([]);
    seenRef.current = new Set();
    bufferRef.current = [];
    playheadRef.current = `${startDate}T00:00:00Z`;
    checkpointDayRef.current = startDate;
    atEndRef.current = false;
    setClock(startDate);
  }, [startDate]);

  // Rewind the replay clock to the start and reload the buffer.
  const align = useCallback(async () => {
    await fetch("/api/replay", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
    resetFeedState();
    bufferRef.current = await fetchMore();
    alignedRef.current = true;
  }, [fetchMore, resetFeedState]);

  const ensureAligned = useCallback(async () => {
    if (!alignedRef.current) await align();
  }, [align]);

  const toggle = useCallback(async () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    setBusy(true);
    try {
      await ensureAligned();
    } finally {
      setBusy(false);
    }
    setPlaying(true);
  }, [playing, ensureAligned]);

  const reset = useCallback(async () => {
    setPlaying(false);
    setBusy(true);
    try {
      await align();
    } finally {
      setBusy(false);
    }
  }, [align]);

  // Fast-forward by whole days/weeks: advance the clock once and reveal a sample.
  const jump = useCallback(
    async (days: number) => {
      if (lockRef.current) return;
      setPlaying(false);
      setBusy(true);
      try {
        await ensureAligned();
        const target = addDays(checkpointDayRef.current, days);
        playheadRef.current = `${target}T00:00:00Z`;
        bufferRef.current = [];
        atEndRef.current = false;
        await runCheckpoint(days);
        const fresh = await fetchMore();
        prepend(
          fresh
            .slice(0, 12)
            .reverse()
            .map((o): Entry => ({ kind: "order", order: o })),
        );
        bufferRef.current = fresh.slice(12);
      } finally {
        setBusy(false);
      }
    },
    [ensureAligned, runCheckpoint, fetchMore, prepend],
  );

  // The ticker: reveal orders one batch per tick, checkpoint on day boundaries.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!playingRef.current || lockRef.current) return;

      if (bufferRef.current.length < 10 && !fetchingRef.current && !atEndRef.current) {
        void fetchMore().then((fresh) => {
          bufferRef.current = [...bufferRef.current, ...fresh];
        });
      }

      const take = Math.min(speedRef.current, bufferRef.current.length);
      if (take === 0) {
        if (atEndRef.current) setPlaying(false);
        return;
      }

      const revealed = bufferRef.current.slice(0, take);
      bufferRef.current = bufferRef.current.slice(take);
      playheadRef.current = revealed[revealed.length - 1].created_at;
      prepend(
        revealed
          .slice()
          .reverse()
          .map((o): Entry => ({ kind: "order", order: o })),
      );

      const newDay = dayOf(playheadRef.current);
      if (newDay > checkpointDayRef.current) {
        void runCheckpoint(daysBetween(checkpointDayRef.current, newDay));
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [fetchMore, prepend, runCheckpoint]);

  const primaryLabel = playing ? "Pause" : entries.length > 0 ? "Resume" : "Start";

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Live order stream</p>
          <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Replaying from {startDate}
            {dataEnd ? ` → ${dataEnd}` : ""} · clock{" "}
            <span className="font-medium text-foreground">{clock}</span>
            {busy ? " · working…" : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void toggle()} disabled={busy}>
            {primaryLabel}
          </Button>
          <Button variant="outline" onClick={() => void jump(1)} disabled={busy}>
            +1 day
          </Button>
          <Button variant="outline" onClick={() => void jump(7)} disabled={busy}>
            +1 week
          </Button>
          <Button variant="ghost" onClick={() => void reset()} disabled={busy}>
            Reset
          </Button>
          <div className="flex overflow-hidden rounded-md border border-border">
            {SPEEDS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSpeed(s.value)}
                className={`px-2.5 py-1 text-xs ${
                  speed === s.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {entries.length === 0 ? (
          <div className="px-3 py-10 text-center text-sm text-muted-foreground">
            Press <span className="font-medium text-foreground">Start</span> to stream orders from {startDate}.
          </div>
        ) : (
          entries.map((e) =>
            e.kind === "order" ? (
              <OrderRow key={e.order.order_id} order={e.order} />
            ) : (
              <div
                key={e.id}
                className="flex items-start gap-2 border-b border-border bg-destructive/5 px-3 py-2 text-xs"
              >
                <span aria-hidden className="text-destructive">
                  ⚠
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {e.cursor} · detection · {e.incidents.length} incident
                    {e.incidents.length === 1 ? "" : "s"} opened
                  </p>
                  <ul className="text-muted-foreground">
                    {e.incidents.slice(0, 4).map((i, idx) => (
                      <li key={idx} className="truncate">
                        {i.title}
                      </li>
                    ))}
                  </ul>
                  <Link href="/incidents" className="text-primary hover:underline">
                    View on Kanban →
                  </Link>
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}
