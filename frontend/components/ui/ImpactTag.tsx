import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatGBP(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ImpactTag({
  amount,
  label,
}: {
  amount?: number | null;
  label?: string | null;
}) {
  if (!amount) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded font-mono font-semibold bg-red-500/10 text-red-400 border-red-500/20",
      )}
    >
      {formatGBP(amount)}
      {label ? (
        <span className="font-normal text-red-400/60">{label}</span>
      ) : null}
    </Badge>
  );
}
