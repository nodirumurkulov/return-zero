const labels: Record<string, string> = {
  detected:          "Detected",
  investigating:     "Investigating",
  fix_proposed:      "Fix Proposed",
  awaiting_approval: "Awaiting Approval",
  deploying:         "Deploying",
  monitoring:        "Monitoring",
  resolved:          "Resolved",
};

const styles: Record<string, string> = {
  detected:          "bg-zinc-700/50 text-zinc-300 border border-zinc-600/50",
  investigating:     "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  fix_proposed:      "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  awaiting_approval: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  deploying:         "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  monitoring:        "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
  resolved:          "bg-green-500/20 text-green-400 border border-green-500/30",
};

export default function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "detected";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[s] ?? styles.detected}`}
    >
      {labels[s] ?? s}
    </span>
  );
}
