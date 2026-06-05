import { Card } from "@/components/ui/card";
import type { AgentFinding } from "@/lib/stores/incidents";

export default function AgentFindingCard({ finding }: { finding: AgentFinding }) {
  const hasDetail = finding.detail && Object.keys(finding.detail).length > 0;
  return (
    <Card className="gap-0 p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary-subtle text-sm text-primary">
          {finding.agent_icon ?? "🤖"}
        </span>
        <span className="text-[12px] font-semibold text-foreground">{finding.agent_name}</span>
      </div>
      <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground [text-wrap:pretty]">
        {finding.summary}
      </p>
      {hasDetail ? (
        <details className="mt-3 border-t border-border pt-2.5">
          <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
            Raw data
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {JSON.stringify(finding.detail, null, 2)}
          </pre>
        </details>
      ) : null}
    </Card>
  );
}
