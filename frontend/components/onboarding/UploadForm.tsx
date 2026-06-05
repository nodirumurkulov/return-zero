"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CONTRACT_FILES } from "@/lib/onboarding/schemas";

type ImportResult = { table: string; count: number; error?: string };
type Phase = "idle" | "uploading" | "learning";

export default function UploadForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResults(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        setPhase("uploading");
        const res = await fetch("/api/onboarding/upload", { method: "POST", body: formData });
        const json = (await res.json()) as { error?: string; results?: ImportResult[] };
        if (!json.results) {
          setError(json.error ?? "Upload failed");
          setPhase("idle");
          return;
        }
        setResults(json.results);

        // Build the knowledge base + business report, then land on the report.
        setPhase("learning");
        const learnRes = await fetch("/api/learn", { method: "POST" });
        const learnJson = (await learnRes.json()) as { success?: boolean; error?: string };
        if (!learnRes.ok || !learnJson.success) {
          setError(learnJson.error ?? "Analysis failed");
          setPhase("idle");
          return;
        }
        router.push("/onboarding/report");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPhase("idle");
      }
    });
  }

  const label = !pending
    ? "Upload & analyse"
    : phase === "learning"
      ? "Learning your baselines & building report…"
      : "Uploading…";

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Upload the CSVs you have — the more you provide, the richer the analysis. This replaces any
            existing data and starts a fresh slate (no incidents yet — they appear once you play the stream).
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {CONTRACT_FILES.map((name) => (
              <label key={name} className="space-y-1 text-xs">
                <span className="font-mono text-muted-foreground">{name}</span>
                <input
                  type="file"
                  name={name}
                  accept=".csv,text/csv"
                  className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded file:border file:border-border file:bg-secondary file:px-2 file:py-1 file:text-foreground"
                />
              </label>
            ))}
          </div>

          <Button type="submit" disabled={pending}>
            {label}
          </Button>
        </form>

        {error && <p className="mt-3 text-sm text-sev-critical">{error}</p>}

        {results && (
          <div className="mt-4 space-y-1 font-mono text-xs">
            {results.map((r) => (
              <div key={r.table} className={r.error ? "text-sev-critical" : "text-sev-resolved"}>
                {r.error ? "✗" : "✓"} {r.table}: {r.count.toLocaleString()}
                {r.error ? ` — ${r.error}` : ""}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
