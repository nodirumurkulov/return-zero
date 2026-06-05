"use client";

import { Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import BusinessProfileForm from "@/components/onboarding/BusinessProfileForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConnectStore, useRunLearn } from "@/lib/onboarding/hooks";
import type { LoadResult } from "@/lib/stores/connect";

type Step = "choose" | "profile";

export default function StoreConnectForm() {
  const router = useRouter();
  const connect = useConnectStore();
  const learn = useRunLearn();
  const [step, setStep] = useState<Step>("choose");
  const [results, setResults] = useState<LoadResult[] | null>(null);

  const pending = connect.isPending || learn.isPending;
  const error =
    connect.error instanceof Error
      ? connect.error.message
      : learn.error instanceof Error
        ? learn.error.message
        : null;

  function connectMockStore() {
    connect.mutate(
      { platform: "mock_csv" },
      {
        onSuccess: (data) => {
          setResults(data.results);
          setStep("profile");
        },
      },
    );
  }

  if (step === "profile") {
    return (
      <div className="flex flex-col gap-4">
        {results && (
          <div className="rounded-md border border-border bg-card p-3 font-mono text-xs">
            {results.map((r) => (
              <div key={r.table} className={r.error ? "text-sev-critical" : "text-sev-resolved"}>
                {r.error ? "✗" : "✓"} {r.table}: {r.count.toLocaleString()}
                {r.error ? ` — ${r.error}` : ""}
              </div>
            ))}
          </div>
        )}
        <BusinessProfileForm
          onSaved={() => {
            learn.mutate(undefined, {
              onSuccess: () => {
                router.push("/onboarding/report");
              },
            });
          }}
        />
        {error && <p className="text-sm text-sev-critical">{error}</p>}
      </div>
    );
  }

  const connectLabel = pending
    ? connect.isPending
      ? "Loading demo store…"
      : "Working…"
    : "Use Pretty Fly demo store";

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <p className="text-xs text-muted-foreground">
          Pick how you want to connect. The Pretty Fly demo loads a full ecommerce dataset automatically — no
          file upload. This replaces any existing data and starts a fresh slate (no incidents until you play the
          stream).
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => connectMockStore()}
            disabled={pending}
            className="flex flex-col items-start gap-2 rounded-lg border border-border bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
          >
            <Store className="size-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Pretty Fly demo store</span>
            <span className="text-xs text-muted-foreground">
              Pre-loaded catalog, orders, ads, and support data for Resolve demos.
            </span>
          </button>

          <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border bg-muted/10 p-4 opacity-60">
            <Store className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Shopify</span>
            <span className="text-xs text-muted-foreground">Coming soon — connect your live Shopify store.</span>
          </div>
        </div>

        <Button onClick={() => connectMockStore()} disabled={pending}>
          {connectLabel}
        </Button>

        {error && <p className="text-sm text-sev-critical">{error}</p>}
      </CardContent>
    </Card>
  );
}
