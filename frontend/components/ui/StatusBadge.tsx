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
  detected: "bg-zinc-700/50 text-zinc-300 border-zinc-600/50",
  investigating: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fix_proposed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  awaiting_approval: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  deploying: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  monitoring: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
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
