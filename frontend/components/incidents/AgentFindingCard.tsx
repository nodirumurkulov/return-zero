import type { AgentFinding } from "@/lib/incidents";

export type { AgentFinding } from "@/lib/incidents";

export default function AgentFindingCard({ finding }: { finding: AgentFinding }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{finding.agent_icon ?? "🤖"}</span>
        <span className="text-sm font-medium text-zinc-200">{finding.agent_name}</span>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">{finding.summary}</p>

      {finding.detail && Object.keys(finding.detail).length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-zinc-600 hover:text-zinc-400 cursor-pointer">
            Raw data
          </summary>
          <pre className="mt-2 text-[11px] text-zinc-500 bg-zinc-950 rounded p-3 overflow-auto max-h-40 font-mono leading-relaxed">
            {JSON.stringify(finding.detail, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
