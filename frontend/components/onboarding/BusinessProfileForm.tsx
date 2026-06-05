"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionLabel } from "@/components/ui/section-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BusinessProfileData } from "@/lib/onboarding/api";
import { useBusinessProfile, useSaveBusinessProfile } from "@/lib/onboarding/hooks";
import { businessProfileInputSchema, type BusinessProfileInput } from "@/lib/settings/schemas";
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
  onSaved: () => void;
}

export default function BusinessProfileForm({ onSaved }: BusinessProfileFormProps) {
  const profileQuery = useBusinessProfile();

  if (profileQuery.isPending) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">Loading business profile…</CardContent>
      </Card>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    const message =
      profileQuery.error instanceof Error ? profileQuery.error.message : "Failed to load profile";
    return (
      <Card>
        <CardContent className="p-4 text-sm text-sev-critical">{message}</CardContent>
      </Card>
    );
  }

  return <BusinessProfileFormFields data={profileQuery.data} onSaved={onSaved} />;
}

function BusinessProfileFormFields({
  data,
  onSaved,
}: {
  data: BusinessProfileData;
  onSaved: () => void;
}) {
  const saveProfile = useSaveBusinessProfile();
  const { profile, productCosts: initialCosts } = data;

  const [platform, setPlatform] = useState<BusinessProfileInput["platform"]>(profile.platform);
  const [storeName, setStoreName] = useState(profile.storeName);
  const [primaryGoal, setPrimaryGoal] = useState<BusinessProfileInput["primaryGoal"]>(profile.primaryGoal);
  const [targetMarginPct, setTargetMarginPct] = useState(profile.targetMarginPct);
  const [minRoas, setMinRoas] = useState(profile.minRoas);
  const [leadTimeDays, setLeadTimeDays] = useState(profile.leadTimeDays);
  const [bufferDays, setBufferDays] = useState(profile.bufferDays);
  const [heroProductIds, setHeroProductIds] = useState(profile.heroProductIds.join(", "));
  const [productCosts, setProductCosts] = useState<ProductCostRow[]>(initialCosts);
  const [validationError, setValidationError] = useState<string | null>(null);

  function updateCost(productId: string, value: string) {
    const costPerUnit = Number(value);
    setProductCosts((rows) =>
      rows.map((r) =>
        r.productId === productId ? { ...r, costPerUnit: Number.isFinite(costPerUnit) ? costPerUnit : 0 } : r,
      ),
    );
  }

  function submit() {
    setValidationError(null);
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
      setValidationError(parsed.error.issues.map((i) => i.message).join("; "));
      return;
    }

    saveProfile.mutate(
      { profile: parsed.data },
      {
        onSuccess: () => {
          onSaved();
        },
      },
    );
  }

  const saveError =
    saveProfile.error instanceof Error ? saveProfile.error.message : null;
  const error = validationError ?? saveError;
  const pending = saveProfile.isPending;

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-4">
        <div>
          <SectionLabel>About your store</SectionLabel>
          <p className="mt-1 text-xs text-muted-foreground">
            These settings drive your monitors. You can change them later from onboarding.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 text-sm">
            <Label htmlFor="platform">E-commerce platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as BusinessProfileInput["platform"])}>
              <SelectTrigger id="platform" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <Label htmlFor="storeName">Store name</Label>
            <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <Label htmlFor="primaryGoal">Primary goal</Label>
            <Select
              value={primaryGoal}
              onValueChange={(v) => setPrimaryGoal(v as BusinessProfileInput["primaryGoal"])}
            >
              <SelectTrigger id="primaryGoal" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
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
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <Label htmlFor="minRoas">Min ROAS</Label>
            <Input
              id="minRoas"
              type="number"
              step="any"
              min={0.1}
              value={minRoas}
              onChange={(e) => setMinRoas(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <Label htmlFor="leadTime">Supplier lead time (days)</Label>
            <Input
              id="leadTime"
              type="number"
              step={1}
              min={1}
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <Label htmlFor="bufferDays">Safety buffer (days)</Label>
            <Input
              id="bufferDays"
              type="number"
              step={1}
              min={0}
              value={bufferDays}
              onChange={(e) => setBufferDays(Number(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <Label htmlFor="heroProducts">Hero products (optional, comma-separated product IDs)</Label>
            <Input
              id="heroProducts"
              value={heroProductIds}
              onChange={(e) => setHeroProductIds(e.target.value)}
              placeholder="prod_00001, prod_00005"
            />
          </div>
        </div>

        {productCosts.length > 0 && (
          <div className="flex flex-col gap-3">
            <SectionLabel>Confirm cost per product</SectionLabel>
            <div className="max-h-64 flex flex-col gap-2 overflow-y-auto">
              {productCosts.map((row) => (
                <div
                  key={row.productId}
                  className="grid gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_120px]"
                >
                  <div>
                    <p className="text-sm font-medium">{row.title}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{row.productId}</p>
                  </div>
                  <label className="flex flex-col gap-1 text-xs">
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
