"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CONTRACT_FILES } from "@/lib/onboarding/schemas";

type ImportResult = { table: string; count: number; error?: string };

export default function UploadForm() {
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResults(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await fetch("/api/onboarding/upload", { method: "POST", body: formData });
        const json = (await res.json()) as { error?: string; results?: ImportResult[] };
        if (json.results) setResults(json.results);
        else setError(json.error ?? "Upload failed");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Upload the CSVs you have — the more you provide, the richer the analysis. Existing data is replaced.
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
            {pending ? "Uploading & analysing…" : "Upload & analyse"}
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
