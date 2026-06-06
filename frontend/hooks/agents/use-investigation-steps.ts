"use client";

import { useEffect, useRef, useState } from "react";

import type { InvestigationStepsResponse } from "@/lib/agents/schemas";
import { fetchInvestigationSteps } from "@/lib/api/investigate/steps";

const POLL_MS = 1500;

export function useInvestigationSteps(args: {
  incidentId: string;
  active: boolean;
  onSettled?: () => void;
}) {
  const [snapshot, setSnapshot] = useState<InvestigationStepsResponse | null>(null);
  const onSettledRef = useRef(args.onSettled);
  onSettledRef.current = args.onSettled;

  useEffect(() => {
    if (!args.active) {
      return;
    }

    let cancelled = false;
    let settled = false;

    const poll = async () => {
      const data = await fetchInvestigationSteps(args.incidentId).catch(() => null);
      if (cancelled || !data) return;

      setSnapshot(data);

      if (
        !settled &&
        (data.run_status === "complete" || data.run_status === "error")
      ) {
        settled = true;
        onSettledRef.current?.();
      }
    };

    void poll();
    const timer = setInterval(() => {
      void poll();
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [args.active, args.incidentId]);

  return snapshot;
}
