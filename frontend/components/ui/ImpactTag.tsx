function formatGBP(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ImpactTag({
  amount,
  label,
}: {
  amount?: number | null;
  label?: string | null;
}) {
  if (!amount) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
      {formatGBP(amount)}
      {label && <span className="text-red-400/60 font-normal">{label}</span>}
    </span>
  );
}
