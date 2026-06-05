import { cn } from "@/lib/utils";

// Thin 0–100 confidence track (design: ui.jsx ConfidenceBar).
export function ConfidenceBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const tone =
    pct >= 75 ? "bg-sev-critical" : pct >= 50 ? "bg-sev-high" : pct >= 25 ? "bg-sev-monitor" : "bg-zinc-300";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabnum text-xs font-medium text-zinc-700">{pct}%</span>
    </div>
  );
}
