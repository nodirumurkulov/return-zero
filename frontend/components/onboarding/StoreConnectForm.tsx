"use client";

import { Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConnectStore } from "@/hooks/stores/connect";
import { useRunLearn } from "@/hooks/stores/learn";
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

  function retryConnectAndLearn() {
    connect.mutate("mock_csv", {
      onSuccess: () => {
        runLearnAndRedirect();
      },
    });
  }

  const actionLabel = pending
    ? connect.isPending
      ? "Reconnecting demo store…"
      : "Analyzing your store…"
    : mockStoreReady
      ? "Run analysis"
      : "Load demo store and analyze";

  if (mockStoreReady) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-3">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Pretty Fly demo store</p>
            <p className="text-xs text-muted-foreground">Connected at signup with catalog, orders, and support data.</p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Check className="size-3" aria-hidden />
            Ready
          </Badge>
        </div>

        <Button onClick={() => runLearnAndRedirect()} disabled={pending} className="w-fit">
          {actionLabel}
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Your demo store did not finish loading. Retry provisioning, then Hugo will learn what&apos;s
        normal and watch for problems.
      </p>

      <Button onClick={() => retryConnectAndLearn()} disabled={pending} className="w-fit">
        {actionLabel}
      </Button>

      {error && <p className={cn("text-sm text-destructive")}>{error}</p>}
    </div>
  );
}
