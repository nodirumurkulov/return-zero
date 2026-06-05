"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useRunLearn } from "@/lib/onboarding/hooks";

export function RunAnalysis({ label = "Run analysis" }: { label?: string }) {
  const router = useRouter();
  const learn = useRunLearn();

  const error = learn.error instanceof Error ? learn.error.message : null;

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        onClick={() => {
          learn.mutate(undefined, {
            onSuccess: () => {
              router.refresh();
            },
          });
        }}
        disabled={learn.isPending}
      >
        {learn.isPending ? "Analyzing your data…" : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
