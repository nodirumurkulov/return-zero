"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionLabel from "@/components/ui/section-label";
import { Card, CardContent } from "@/components/ui/card";
import { updateThreshold } from "@/app/actions";
import type { MetricValue } from "@/lib/metrics/types";

export default function ThresholdEditor({
  productId,
  metrics,
}: {
  productId: string;
  metrics: MetricValue[];
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
        {metrics.map((m) => (
          <form
            key={m.metric_key}
            action={onSave}
            className="grid items-end gap-3 rounded-md border border-border p-3 md:grid-cols-4"
          >
            <input type="hidden" name="metric_key" value={m.metric_key} />
            <div className="md:col-span-2">
              <p className="text-sm font-medium">{m.display_name}</p>
              <p className="text-xs text-muted-foreground">
                Alert when {m.direction === "below" ? "below" : "above"} threshold
              </p>
            </div>
            <label className="space-y-1 text-xs">
              <span className="text-muted-foreground">Threshold</span>
              <Input name="threshold" type="number" step="0.01" defaultValue={m.threshold} required />
            </label>
            <div className="flex items-end">
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
