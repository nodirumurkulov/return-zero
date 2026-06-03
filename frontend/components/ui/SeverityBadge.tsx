const styles: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border border-red-500/30",
  high:     "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  medium:   "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  low:      "bg-green-500/20 text-green-400 border border-green-500/30",
};

const dots: Record<string, string> = {
  critical: "bg-red-400",
  high:     "bg-orange-400",
  medium:   "bg-yellow-400",
  low:      "bg-green-400",
};

export default function SeverityBadge({ severity }: { severity: string }) {
  const s = severity?.toLowerCase() ?? "medium";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${styles[s] ?? styles.medium}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[s] ?? dots.medium}`} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}
