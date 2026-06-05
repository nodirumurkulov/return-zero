"use client";

import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { learnResponseSchema } from "@/lib/learn/schemas";
import { onboardingUploadResponseSchema } from "@/lib/onboarding/api-schemas";
import type { ImportResult } from "@/lib/onboarding/import";
import { CONTRACT_FILES } from "@/lib/onboarding/schemas";

type Phase = "idle" | "uploading" | "learning";

const EXPECTED = new Set(CONTRACT_FILES);
// basename, lowercased, path-stripped — so folder picks + odd casing still match.
const baseName = (f: File): string => (f.name.split(/[\\/]/).pop() ?? f.name).toLowerCase();

export default function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<Phase>("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dedupe by basename (last pick wins); split into recognised vs ignored.
  const byName = new Map<string, File>();
  files.forEach((f) => byName.set(baseName(f), f));
  const matched = [...byName.entries()].filter(([n]) => EXPECTED.has(n));
  const unmatched = [...byName.keys()].filter((n) => !EXPECTED.has(n));

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    setResults(null);
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  function submit() {
    if (matched.length === 0) {
      setError("No matching CSVs found. Expected files named like orders.csv, products.csv …");
      return;
    }
    const fd = new FormData();
    matched.forEach(([name, file]) => fd.append(name, file));
    startTransition(async () => {
      try {
        setPhase("uploading");
        const res = await fetch("/api/onboarding/upload", { method: "POST", body: fd });
        const uploadJson: unknown = await res.json();
        const uploadParsed = onboardingUploadResponseSchema.safeParse(uploadJson);
        if (!uploadParsed.success) {
          setError("Upload failed");
          setPhase("idle");
          return;
        }
        if ("error" in uploadParsed.data) {
          setError(uploadParsed.data.error);
          setPhase("idle");
          return;
        }
        if (!uploadParsed.data.success) {
          setError("Upload failed");
          setPhase("idle");
          return;
        }
        setResults(uploadParsed.data.results);

        setPhase("learning");
        const learnRes = await fetch("/api/learn", { method: "POST" });
        const learnJson: unknown = await learnRes.json();
        const learnParsed = learnResponseSchema.safeParse(learnJson);
        if (!learnRes.ok || !learnParsed.success || !("success" in learnParsed.data && learnParsed.data.success)) {
          const message =
            learnParsed.success && "error" in learnParsed.data
              ? learnParsed.data.error
              : "Analysis failed";
          setError(message);
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

  const label = pending
    ? phase === "learning"
      ? "Learning your baselines & building report…"
      : "Uploading…"
    : `Upload & analyse${matched.length ? ` · ${matched.length} file${matched.length === 1 ? "" : "s"}` : ""}`;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <p className="text-xs text-muted-foreground">
          Drop all your CSV exports here (or click to choose). Select them all at once. We match each file
          to its table by name. This replaces any existing data and starts a fresh slate (no incidents until
          you play the stream).
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors ${
            dragOver ? "border-primary bg-primary-subtle" : "border-border bg-muted/30 hover:bg-muted/50"
          }`}
        >
          <UploadCloud className="size-6 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Drop your CSVs here, or click to choose</span>
          <span className="text-xs text-muted-foreground">
            Select all {CONTRACT_FILES.length} at once. We&apos;ll figure out which is which
          </span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
        </button>

        {byName.size > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                {matched.length} of {CONTRACT_FILES.length} tables matched
              </span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setFiles([]);
                  setResults(null);
                  setError(null);
                }}
              >
                Clear
              </button>
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              {CONTRACT_FILES.map((name) => {
                const has = byName.has(name);
                return (
                  <div
                    key={name}
                    className={`flex items-center gap-1.5 font-mono text-[11px] ${
                      has ? "text-sev-resolved" : "text-muted-foreground"
                    }`}
                  >
                    <span>{has ? "✓" : "○"}</span>
                    {name}
                  </div>
                );
              })}
            </div>
            {unmatched.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Ignored (no matching table): {unmatched.join(", ")}
              </p>
            )}
          </div>
        )}

        <Button onClick={() => submit()} disabled={pending || matched.length === 0}>
          {label}
        </Button>

        {error && <p className="text-sm text-sev-critical">{error}</p>}

        {results && (
          <div className="space-y-1 font-mono text-xs">
            {results.map((r) => (
              <div key={r.table} className={r.error ? "text-sev-critical" : "text-sev-resolved"}>
                {r.error ? "✗" : "✓"} {r.table}: {r.count.toLocaleString()}
                {r.error ? `: ${r.error}` : ""}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
