import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  critical: "bg-sev-criticalBg text-sev-critical border-sev-criticalBd",
  high: "bg-sev-highBg text-sev-high border-sev-highBd",
  medium: "bg-sev-monitorBg text-sev-monitor border-sev-monitorBd",
  low: "bg-sev-resolvedBg text-sev-resolved border-sev-resolvedBd",
};

const dots: Record<string, string> = {
  critical: "bg-sev-critical",
  high: "bg-sev-high",
  medium: "bg-sev-monitor",
  low: "bg-sev-resolved",
};

export function SeverityBadge({ severity }: { severity: string }) {
  const s = severity?.toLowerCase() ?? "medium";
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 rounded-full font-medium", styles[s] ?? styles.medium)}
    >
      <span className={cn("size-1.5 rounded-full", dots[s] ?? dots.medium)} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </Badge>
  );
}
