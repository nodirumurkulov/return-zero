import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  detected: "Detected",
  investigating: "Investigating",
  fix_proposed: "Fix Proposed",
  awaiting_approval: "Awaiting Approval",
  deploying: "Deploying",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

const styles: Record<string, string> = {
  detected: "bg-sev-idleBg text-sev-idle border-sev-idleBd",
  investigating: "bg-sev-highBg text-sev-high border-sev-highBd",
  fix_proposed: "bg-primary-subtle text-primary border-primary/20",
  awaiting_approval: "bg-sev-monitorBg text-sev-monitor border-sev-monitorBd",
  deploying: "bg-sev-highBg text-sev-high border-sev-highBd",
  monitoring: "bg-sev-monitorBg text-sev-monitor border-sev-monitorBd",
  resolved: "bg-sev-resolvedBg text-sev-resolved border-sev-resolvedBd",
};

export function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "detected";
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-medium", styles[s] ?? styles.detected)}
    >
      {labels[s] ?? s}
    </Badge>
  );
}
