"use client";

import { Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useImportStore } from "@/hooks/stores/import";

type StoreConnectFormProps = {
  storeReady?: boolean;
};

export default function StoreConnectForm({ storeReady = false }: StoreConnectFormProps) {
  const router = useRouter();
  const importStore = useImportStore("mock_csv");

  const pending = importStore.isPending;
  const error = importStore.error instanceof Error ? importStore.error.message : null;

  function goToCatalog() {
    router.push("/catalog");
  }

  function connectStore() {
    importStore.mutate(undefined, {
      onSuccess: () => {
        goToCatalog();
      },
    });
  }

  const actionLabel = pending ? "Connecting demo store…" : "Connect demo store";

  if (storeReady) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-3">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Pretty Fly demo store</p>
            <p className="text-xs text-muted-foreground">
              Connected with catalog, orders, and support data.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Check className="size-3" aria-hidden />
            Connected
          </Badge>
        </div>

        <Button onClick={() => goToCatalog()} disabled={pending} className="w-fit">
          Continue to catalog
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Load the Pretty Fly demo dataset to explore Resolve with realistic ecommerce data.
      </p>

      <Button onClick={() => connectStore()} disabled={pending} className="w-fit">
        {actionLabel}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
