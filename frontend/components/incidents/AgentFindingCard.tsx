import { Card, CardContent } from "@/components/ui/card";

export type AgentFinding = {
  id: string;
  agent_name: string;
  agent_icon?: string;
  summary: string;
  detail?: Record<string, unknown>;
  created_at: string;
};

export default function AgentFindingCard({ finding }: { finding: AgentFinding }) {
  return (
    <Card className="shadow-card">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{finding.agent_icon ?? "🤖"}</span>
          <span className="text-sm font-medium">{finding.agent_name}</span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{finding.summary}</p>

        {finding.detail && Object.keys(finding.detail).length > 0 && (
          <details>
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Raw data
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {JSON.stringify(finding.detail, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
