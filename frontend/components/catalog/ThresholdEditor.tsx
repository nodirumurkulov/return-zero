"use client";

import { useState, useTransition } from "react";
import { updateThreshold } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SectionLabel from "@/components/ui/section-label";
import type { KpiThreshold } from "@/lib/catalog";

const KPI_LABELS: Record<string, string> = {
  return_rate: "Return rate",
  refund_rate: "Refund rate",
  support_tickets: "Support tickets",
  ad_roas: "Ad ROAS",
};

export default function ThresholdEditor({
  productId,
  thresholds,
}: {
  productId: string;
  thresholds: KpiThreshold[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onSave(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateThreshold(productId, formData);
      setMessage(result.ok ? "Saved" : result.error ?? "Failed to save");
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <SectionLabel>KPI thresholds</SectionLabel>
        {thresholds.map((threshold) => (
          <form
            key={threshold.id}
            action={onSave}
            className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-4"
          >
            <input type="hidden" name="kpi_name" value={threshold.kpi_name} />
            <div className="md:col-span-4">
              <p className="text-sm font-medium">
                {KPI_LABELS[threshold.kpi_name] ?? threshold.kpi_name}
              </p>
              <p className="text-xs text-muted-foreground">
                Alert when {threshold.direction === "below" ? "below" : "above"} thresholds
              </p>
            </div>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Warning</span>
              <Input
                name="warning_value"
                type="number"
                step="0.01"
                defaultValue={threshold.warning_value}
                required
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Critical</span>
              <Input
                name="critical_value"
                type="number"
                step="0.01"
                defaultValue={threshold.critical_value}
                required
              />
            </label>
            <div className="flex items-end md:col-span-2">
              <Button type="submit" size="sm" disabled={pending}>
                Save
              </Button>
            </div>
          </form>
        ))}
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </CardContent>
    </Card>
  );
}
