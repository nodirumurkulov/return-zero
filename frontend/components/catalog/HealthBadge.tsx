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

export default function HealthBadge({
  level,
  className,
}: {
  level: HealthLevel;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        styles[level],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[level])} />
      {labels[level]}
    </span>
  );
}
