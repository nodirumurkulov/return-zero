import type { DetectionReason } from "@/lib/incidents/format-detection-reason";

/** Compact breach lines + stat chips for timeline entries. */
export default function DetectionReasonDetails({ reason }: { reason: DetectionReason }) {
  const chips: string[] = [];
  if (reason.stats?.z_score !== undefined) {
    chips.push(`z ${reason.stats.z_score.toFixed(2)}`);
  }
  if (reason.stats?.confidence) {
    chips.push(`${reason.stats.confidence} confidence`);
  }

  if (reason.lines.length === 0 && chips.length === 0) return null;

  return (
    <div className="mt-1.5 space-y-1">
      {reason.lines.map((line) => (
        <p
          key={`${line.label}-${line.detail}`}
          className="text-[12px] leading-snug text-muted-foreground"
        >
          <span className="font-medium text-foreground">{line.label}:</span>{" "}
          <span className="tabnum">{line.detail}</span>
        </p>
      ))}
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1">
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
    </div>
  );
}
