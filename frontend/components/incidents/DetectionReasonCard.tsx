import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import type { DetectionReason } from "@/lib/stores/incidents/format-detection-reason";

export default function DetectionReasonCard({
  reason,
  investigating = false,
}: {
  reason: DetectionReason;
  investigating?: boolean;
}) {
  const chips: string[] = [];
  if (reason.stats?.z_score !== undefined) {
    chips.push(`z ${reason.stats.z_score.toFixed(2)}`);
  }
  if (reason.stats?.confidence) {
    chips.push(`${reason.stats.confidence} confidence`);
  }

  return (
    <Card className="gap-0 p-5">
      <div className="flex items-center gap-1.5">
        <Search className="size-4 text-sev-idle" />
        <SectionLabel>Why this was detected</SectionLabel>
      </div>
      <p className="mt-2 text-[15px] font-semibold leading-snug text-foreground [text-wrap:pretty]">
        {reason.summary}
      </p>
      {reason.lines.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {reason.lines.map((line) => (
            <li
              key={`${line.label}-${line.detail}`}
              className="flex flex-wrap items-baseline gap-x-2 text-[13px] text-muted-foreground"
            >
              <span className="font-medium text-foreground">{line.label}:</span>
              <span className="tabnum">{line.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={c}
              className="tabnum rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}
      {investigating ? (
        <p className="mt-3 text-[12px] text-muted-foreground">Investigation in progress…</p>
      ) : null}
    </Card>
  );
}
