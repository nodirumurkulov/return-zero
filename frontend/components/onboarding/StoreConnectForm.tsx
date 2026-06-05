"use client";

import { Check, ShoppingBag, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { useConnectStore, useRunLearn } from "@/lib/onboarding/hooks";
import { cn } from "@/lib/utils";

type StoreConnectFormProps = {
  /** Demo data was provisioned at signup — skip the connect API on mock selection. */
  mockStoreReady?: boolean;
};

export default function StoreConnectForm({ mockStoreReady = false }: StoreConnectFormProps) {
  const router = useRouter();
  const connect = useConnectStore();
  const learn = useRunLearn();

  const pending = connect.isPending || learn.isPending;
  const error =
    connect.error instanceof Error
      ? connect.error.message
      : learn.error instanceof Error
        ? learn.error.message
        : null;

  function runLearnAndRedirect() {
    learn.mutate(undefined, {
      onSuccess: () => {
        router.push("/onboarding/report");
      },
    });
  }

  function selectMockStore() {
    if (mockStoreReady) {
      runLearnAndRedirect();
      return;
    }

    connect.mutate(
      { platform: "mock_csv" },
      {
        onSuccess: () => {
          runLearnAndRedirect();
        },
      },
    );
  }

  const actionLabel = pending
    ? connect.isPending
      ? "Connecting…"
      : "Analyzing your store…"
    : mockStoreReady
      ? "Get started"
      : "Use demo store";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Choose an integration to connect your store. Hugo will learn what&apos;s normal and watch for problems
        before they cost you.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => selectMockStore()}
          disabled={pending}
          aria-label="Connect Pretty Fly demo store"
          className={cn(
            "group relative flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-colors",
            "hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            pending && "opacity-60",
          )}
        >
          {mockStoreReady && (
            <Badge variant="secondary" className="absolute top-3 right-3 gap-1">
              <Check className="size-3" aria-hidden />
              Ready
            </Badge>
          )}
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-7" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Pretty Fly</p>
            <p className="text-xs text-muted-foreground">
              Demo ecommerce store with catalog, orders, ads, and support data.
            </p>
          </div>
          <span className="text-xs font-medium text-primary">{actionLabel}</span>
        </button>

        <div
          aria-disabled
          className="relative flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/10 p-6 text-center opacity-60"
        >
          <Badge variant="outline" className="absolute top-3 right-3">
            Coming soon
          </Badge>
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ShoppingBag className="size-7" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Shopify</p>
            <p className="text-xs text-muted-foreground">Connect your live Shopify store and sync orders in real time.</p>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-sev-critical">{error}</p>}
    </div>
  );
}
