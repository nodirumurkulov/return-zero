"use client";

import { useState } from "react";

export type IncidentAction = {
  id: string;
  title: string;
  description?: string;
  impact_level: string;
  risk_level: string;
  auto_deploy: boolean;
  status: string;
  approved_by?: string;
  approved_at?: string;
  deployed_at?: string;
};

const impactColour: Record<string, string> = {
  high:   "text-green-400",
  medium: "text-yellow-400",
  low:    "text-zinc-500",
};

const riskColour: Record<string, string> = {
  high:   "text-red-400",
  medium: "text-yellow-400",
  low:    "text-green-400",
};

const statusStyle: Record<string, string> = {
  proposed: "bg-zinc-800 text-zinc-400 border border-zinc-700",
  approved: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  deployed: "bg-green-500/20 text-green-400 border border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
  monitoring: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
};

export default function ActionList({
  actions,
  incidentId,
  onUpdate,
}: {
  actions: IncidentAction[];
  incidentId: string;
  onUpdate?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const proposed = actions.filter((a) => a.status === "proposed");

  async function approveAll() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve_all_low_risk: true, approved_by: "operator" }),
      });
      const json = await res.json() as { approved?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setMessage(`${json.approved} action(s) approved and deployed`);
      onUpdate?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function approveOne(actionId: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_ids: [actionId], approved_by: "operator" }),
      });
      const json = await res.json() as { approved?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setMessage("Action approved and deployed");
      onUpdate?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Bulk approve button */}
      {proposed.filter((a) => !a.auto_deploy && a.risk_level === "low").length > 0 && (
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <span className="text-xs text-zinc-500">
            {proposed.length} action(s) awaiting approval
          </span>
          <button
            onClick={approveAll}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? "Approving…" : "Approve all low-risk"}
          </button>
        </div>
      )}

      {message && (
        <p className="text-xs text-green-400 bg-green-500/10 rounded px-3 py-2 border border-green-500/20">
          {message}
        </p>
      )}

      {actions.map((action) => (
        <div
          key={action.id}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-medium text-zinc-200">{action.title}</span>
                {action.auto_deploy && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Auto-deploy
                  </span>
                )}
              </div>
              {action.description && (
                <p className="text-xs text-zinc-500 leading-relaxed">{action.description}</p>
              )}
              <div className="flex gap-4 mt-2 text-xs">
                <span>
                  Impact:{" "}
                  <span className={impactColour[action.impact_level] ?? "text-zinc-400"}>
                    {action.impact_level}
                  </span>
                </span>
                <span>
                  Risk:{" "}
                  <span className={riskColour[action.risk_level] ?? "text-zinc-400"}>
                    {action.risk_level}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusStyle[action.status] ?? statusStyle.proposed}`}
              >
                {action.status}
              </span>
              {action.status === "proposed" && !action.auto_deploy && (
                <button
                  onClick={() => approveOne(action.id)}
                  disabled={loading}
                  className="text-xs px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-600 transition-colors disabled:opacity-50"
                >
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {actions.length === 0 && (
        <p className="text-sm text-zinc-600 text-center py-4">
          No actions proposed yet
        </p>
      )}
    </div>
  );
}
