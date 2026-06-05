import { Badge } from "@/components/ui/badge";
import type { HealthLevel } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const styles: Record<HealthLevel, string> = {
  healthy: "bg-sev-resolvedBg text-sev-resolved border-sev-resolvedBd",
  warning: "bg-sev-monitorBg text-sev-monitor border-sev-monitorBd",
  critical: "bg-sev-criticalBg text-sev-critical border-sev-criticalBd",
};

const dots: Record<HealthLevel, string> = {
  healthy: "bg-sev-resolved",
  warning: "bg-sev-monitor",
  critical: "bg-sev-critical",
};

const labels: Record<HealthLevel, string> = {
  healthy: "Healthy",
  warning: "At risk",
  critical: "Critical",
};

export function HealthBadge({
  level,
  className,
}: {
  level: HealthLevel;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 rounded-full font-medium", styles[level], className)}
    >
      <span className={cn("size-1.5 rounded-full", dots[level])} />
      {labels[level]}
    </Badge>
  );
}
