import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const dots: Record<string, string> = {
  critical: "bg-red-400",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-green-400",
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
