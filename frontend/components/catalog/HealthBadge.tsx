import { Badge } from "@/components/ui/badge";
import type { HealthLevel } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const styles: Record<HealthLevel, string> = {
  healthy: "bg-sev-low/20 text-green-400 border-sev-low/30",
  warning: "bg-sev-medium/20 text-yellow-400 border-sev-medium/30",
  critical: "bg-sev-critical/20 text-red-400 border-sev-critical/30",
};

const dots: Record<HealthLevel, string> = {
  healthy: "bg-sev-low",
  warning: "bg-sev-medium",
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
