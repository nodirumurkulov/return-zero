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

  useEffect(() => {
    onSettledRef.current = args.onSettled;
  }, [args.onSettled]);

  useEffect(() => {
    if (!args.active) {
      return;
    }

    const flags = { cancelled: false, settled: false };

    const poll = async () => {
      const data = await fetchInvestigationSteps(args.incidentId).catch(() => null);
      if (flags.cancelled || !data) return;

      setSnapshot(data);

      if (
        !flags.settled &&
        (data.run_status === "complete" || data.run_status === "error")
      ) {
        flags.settled = true;
        onSettledRef.current?.();
      }
    };

    void poll();
    const timer = setInterval(() => {
      void poll();
    }, POLL_MS);

    return () => {
      flags.cancelled = true;
      clearInterval(timer);
    };
  }, [args.active, args.incidentId]);

  return snapshot;
}
