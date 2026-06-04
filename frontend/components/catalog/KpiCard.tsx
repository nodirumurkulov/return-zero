import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import Sparkline from "@/components/ui/sparkline";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string;
  subtext?: string;
  trend?: number[];
  accent?: "default" | "danger" | "success";
};

export default function KpiCard({
  label,
  value,
  subtext,
  trend,
  accent = "default",
}: KpiCardProps) {
  const accentClass =
    accent === "danger"
      ? "text-red-400"
      : accent === "success"
        ? "text-green-400"
        : "text-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionLabel>{label}</SectionLabel>
        <CardTitle className={cn("text-2xl font-semibold tabular-nums", accentClass)}>
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        {trend && trend.length > 1 && (
          <Sparkline
            data={trend}
            className="h-10 w-full"
            stroke={accent === "danger" ? "hsl(var(--sev-critical))" : "hsl(var(--primary))"}
          />
        )}
      </CardContent>
    </Card>
  );
}
