"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionLabel } from "@/components/ui/section-label";
import {
  businessProfileInputSchema,
  businessProfileResponseSchema,
  type BusinessProfileInput,
} from "@/lib/settings/schemas";
import type { ProductCostRow } from "@/lib/settings/types";

const PLATFORM_OPTIONS = [
  { value: "shopify", label: "Shopify" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "other", label: "Other" },
] as const;

const GOAL_OPTIONS = [
  { value: "growth", label: "Growth" },
  { value: "margin", label: "Margin" },
  { value: "cash", label: "Cash" },
] as const;

interface BusinessProfileFormProps {
  onSaved: () => void | Promise<void>;
}

export default function BusinessProfileForm({ onSaved }: BusinessProfileFormProps) {
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<BusinessProfileInput["platform"]>("shopify");
  const [storeName, setStoreName] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState<BusinessProfileInput["primaryGoal"]>("growth");
  const [targetMarginPct, setTargetMarginPct] = useState(55);
  const [minRoas, setMinRoas] = useState(3);
  const [leadTimeDays, setLeadTimeDays] = useState(71);
  const [bufferDays, setBufferDays] = useState(14);
  const [heroProductIds, setHeroProductIds] = useState("");
  const [productCosts, setProductCosts] = useState<ProductCostRow[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/onboarding/profile", { signal: controller.signal });
        const json: unknown = await res.json();
        if (!res.ok) {
          const msg = typeof json === "object" && json && "error" in json ? String(json.error) : "Failed to load profile";
          throw new Error(msg);
        }
        const parsed = businessProfileResponseSchema.safeParse(json);
        if (!parsed.success) throw new Error("Invalid profile response");
        if (controller.signal.aborted) return;
        const { profile, productCosts: costs } = parsed.data;
        setPlatform(profile.platform);
        setStoreName(profile.storeName);
        setPrimaryGoal(profile.primaryGoal);
        setTargetMarginPct(profile.targetMarginPct);
        setMinRoas(profile.minRoas);
        setLeadTimeDays(profile.leadTimeDays);
        setBufferDays(profile.bufferDays);
        setHeroProductIds(profile.heroProductIds.join(", "));
        setProductCosts(costs);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to load profile");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  function updateCost(productId: string, value: string) {
    const costPerUnit = Number(value);
    setProductCosts((rows) =>
      rows.map((r) =>
        r.productId === productId ? { ...r, costPerUnit: Number.isFinite(costPerUnit) ? costPerUnit : 0 } : r,
      ),
    );
  }

  function submit() {
    setError(null);
    const payload = {
      platform,
      storeName,
      primaryGoal,
      targetMarginPct,
      minRoas,
      leadTimeDays,
      bufferDays,
      heroProductIds: heroProductIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      productCosts: productCosts.map((r) => ({ productId: r.productId, costPerUnit: r.costPerUnit })),
    };
    const parsed = businessProfileInputSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/onboarding/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const json: unknown = await res.json();
        if (!res.ok) {
          const msg = typeof json === "object" && json && "error" in json ? String(json.error) : "Save failed";
          throw new Error(msg);
        }
        await onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">Loading business profile…</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-4">
        <div>
          <SectionLabel>About your store</SectionLabel>
          <p className="mt-1 text-xs text-muted-foreground">
            These settings drive your monitors. You can change them later from onboarding.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <Label htmlFor="platform">E-commerce platform</Label>
            <select
              id="platform"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as BusinessProfileInput["platform"])}
            >
              {PLATFORM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <Label htmlFor="storeName">Store name</Label>
            <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
          </label>

          <label className="space-y-1.5 text-sm sm:col-span-2">
            <Label htmlFor="primaryGoal">Primary goal</Label>
            <select
              id="primaryGoal"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value as BusinessProfileInput["primaryGoal"])}
            >
              {GOAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <Label htmlFor="targetMargin">Target gross margin %</Label>
            <Input
              id="targetMargin"
              type="number"
              step="any"
              min={1}
              max={99}
              value={targetMarginPct}
              onChange={(e) => setTargetMarginPct(Number(e.target.value))}
            />
          </label>

          <label className="space-y-1.5 text-sm">
            <Label htmlFor="minRoas">Min ROAS</Label>
            <Input
              id="minRoas"
              type="number"
              step="any"
              min={0.1}
              value={minRoas}
              onChange={(e) => setMinRoas(Number(e.target.value))}
            />
          </label>

          <label className="space-y-1.5 text-sm">
            <Label htmlFor="leadTime">Supplier lead time (days)</Label>
            <Input
              id="leadTime"
              type="number"
              step={1}
              min={1}
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(Number(e.target.value))}
            />
          </label>

          <label className="space-y-1.5 text-sm">
            <Label htmlFor="bufferDays">Safety buffer (days)</Label>
            <Input
              id="bufferDays"
              type="number"
              step={1}
              min={0}
              value={bufferDays}
              onChange={(e) => setBufferDays(Number(e.target.value))}
            />
          </label>

          <label className="space-y-1.5 text-sm sm:col-span-2">
            <Label htmlFor="heroProducts">Hero products (optional, comma-separated product IDs)</Label>
            <Input
              id="heroProducts"
              value={heroProductIds}
              onChange={(e) => setHeroProductIds(e.target.value)}
              placeholder="prod_00001, prod_00005"
            />
          </label>
        </div>

        {productCosts.length > 0 && (
          <div className="space-y-3">
            <SectionLabel>Confirm cost per product</SectionLabel>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {productCosts.map((row) => (
                <div
                  key={row.productId}
                  className="grid gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_120px]"
                >
                  <div>
                    <p className="text-sm font-medium">{row.title}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{row.productId}</p>
                  </div>
                  <label className="space-y-1 text-xs">
                    <span className="text-muted-foreground">Cost (£)</span>
                    <Input
                      type="number"
                      step="any"
                      min={0}
                      value={row.costPerUnit}
                      onChange={(e) => updateCost(row.productId, e.target.value)}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={() => submit()} disabled={pending || !storeName.trim()}>
          {pending ? "Saving & analysing…" : "Save profile & build report"}
        </Button>

        {error && <p className="text-sm text-sev-critical">{error}</p>}
      </CardContent>
    </Card>
  );
}
