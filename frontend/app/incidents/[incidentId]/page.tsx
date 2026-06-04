"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ActionList from "@/components/incidents/ActionList";
import AgentFindingCard from "@/components/incidents/AgentFindingCard";
import IncidentTimeline from "@/components/incidents/IncidentTimeline";
import { EmptyState } from "@/components/ui/empty-state";
import ImpactTag from "@/components/ui/ImpactTag";
import SeverityBadge from "@/components/ui/SeverityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import type { IncidentDetail } from "@/lib/incidents";

export default function IncidentDetailPage() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const [data, setData] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/incidents/${incidentId}`);
    const json = (await res.json()) as IncidentDetail & { error?: string };
    if (!res.ok) throw new Error(json.error ?? "Not found");
    return json;
  }, [incidentId]);

  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    load()
      .then((json) => {
        if (!cancelledRef.current) setData(json);
      })
      .catch((err: unknown) => {
        if (!cancelledRef.current) setError(err instanceof Error ? err.message : "Error");
      })
      .finally(() => {
        if (!cancelledRef.current) setLoading(false);
      });
    return () => {
      cancelledRef.current = true;
    };
  }, [load]);

  async function triggerInvestigation() {
    if (!data?.incident.affected_product) return;
    setInvestigating(true);
    try {
      await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: incidentId,
          product_id: data.incident.affected_product,
        }),
      });
      const json = await load();
      setData(json);
    } finally {
      setInvestigating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <span className="text-zinc-500 text-sm font-mono animate-pulse">Loading…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-red-400 text-sm font-mono">{error ?? "Incident not found"}</p>
      </div>
    );
  }

  const { incident, findings, actions, timeline } = data;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Top bar */}
      <div className="border-b border-zinc-900 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/incidents"
            className="text-zinc-500 hover:text-zinc-200 text-xs font-mono transition-colors"
          >
            ← Incidents
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-xs text-zinc-400 font-mono">
            {incident.id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Incident header */}
      <div className="px-6 py-6 border-b border-zinc-900">
        <div className="flex flex-wrap items-start gap-3 mb-4">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
          <ImpactTag amount={incident.impact_amount} label={incident.impact_label} />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight mb-2">{incident.title}</h1>

        {incident.affected_kpis && incident.affected_kpis.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {incident.affected_kpis.map((kpi) => (
              <span
                key={kpi}
                className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 font-mono"
              >
                {kpi}
              </span>
            ))}
          </div>
        )}

        {/* Root cause */}
        {incident.root_cause && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Root Cause
              </span>
              {incident.root_cause_confidence != null && (
                <span className="text-xs text-purple-400 font-mono">
                  {incident.root_cause_confidence}% confidence
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed">{incident.root_cause}</p>
            {incident.root_cause_confidence != null && (
              <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${incident.root_cause_confidence}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Recovery progress (monitoring / resolved) */}
        {incident.monitoring_kpi != null && incident.recovery_pct != null &&
          (incident.status === "monitoring" || incident.status === "resolved") && (
          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4 max-w-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Projected recovery · {incident.monitoring_kpi}
              </span>
              <span className="text-xs text-emerald-400 font-mono">
                {Math.round((incident.recovery_pct ?? 0) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.round((incident.recovery_pct ?? 0) * 100)}%` }}
              />
            </div>
            {incident.baseline_value != null && incident.target_value != null && (
              <p className="mt-2 text-xs text-zinc-500 font-mono">
                baseline {Number(incident.baseline_value).toFixed(2)} → target {Number(incident.target_value).toFixed(2)} (projected)
              </p>
            )}
          </div>
        )}

        {/* Trigger investigation button */}
        {incident.status === "detected" && incident.affected_product && (
          <button
            onClick={() => {
              void triggerInvestigation();
            }}
            disabled={investigating}
            className="mt-4 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white disabled:opacity-50 transition-colors"
          >
            {investigating ? "Investigating…" : "Trigger Investigation"}
          </button>
        )}
      </div>

      {/* Main grid */}
      <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: findings + actions */}
        <div className="lg:col-span-2 space-y-8">
          {/* Agent findings */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Agent Findings
            </h2>
            {findings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {findings.map((f) => (
                  <AgentFindingCard key={f.id} finding={f} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No findings yet"
                description="Trigger investigation to populate agent findings for this incident."
              />
            )}
          </section>

          {/* Actions */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Proposed Actions
            </h2>
            <ActionList
              actions={actions}
              incidentId={incident.id}
              onUpdate={() => {
                void load();
              }}
            />
          </section>
        </div>

        {/* Right: timeline */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Timeline
          </h2>
          <IncidentTimeline events={timeline} />
        </div>
      </div>
    </div>
  );
}
