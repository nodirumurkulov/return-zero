"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { useUpdateThreshold } from "@/hooks/catalog";
import type { KpiThreshold } from "@/types/catalog";

const METRIC_LABELS: Record<string, string> = {
  return_rate: "Return rate",
  refund_rate: "Refund rate",
  support_volume: "Support volume",
  ad_roas: "Ad ROAS",
};

export default function ThresholdEditor({
  productId,
  thresholds,
}: {
  productId: string;
  thresholds: KpiThreshold[];
}) {
  const updateThreshold = useUpdateThreshold({ id: productId });
  const [message, setMessage] = useState<string | null>(null);

  function onSave(formData: FormData) {
    setMessage(null);
    updateThreshold.mutate(formData, {
      onSuccess: (result) => {
        setMessage(result.ok ? "Saved" : (result.error ?? "Failed to save"));
      },
      onError: () => {
        setMessage("Failed to save");
      },
    });
  }

  if (thresholds.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <SectionLabel>KPI thresholds</SectionLabel>
          <p className="text-sm text-muted-foreground">
            No per-product overrides. Defaults from metric definitions apply.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <SectionLabel>KPI thresholds</SectionLabel>
        {thresholds.map((threshold) => (
          <form
            key={threshold.id}
            action={onSave}
            className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-3"
          >
            <input type="hidden" name="metric_key" value={threshold.metric_key} />
            <div className="md:col-span-3">
              <p className="text-sm font-medium">
                {METRIC_LABELS[threshold.metric_key] ?? threshold.metric_key}
              </p>
              <p className="text-xs text-muted-foreground">
                Alert when {effectiveDirection(threshold) === "below" ? "below" : "above"} threshold
              </p>
            </div>
            <label className="space-y-1 text-xs md:col-span-2">
              <span className="text-muted-foreground">Threshold</span>
              <Input
                name="threshold"
                type="number"
                step="any"
                defaultValue={threshold.threshold}
                required
              />
            </label>
            <div className="flex items-end">
              <Button type="submit" size="sm" disabled={updateThreshold.isPending}>
                Save
              </Button>
            </div>
          </form>
        ))}
        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}

function effectiveDirection(threshold: KpiThreshold): "above" | "below" {
  return threshold.direction === "below" ? "below" : "above";
}
