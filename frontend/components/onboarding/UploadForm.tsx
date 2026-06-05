"use client";

import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import BusinessProfileForm from "@/components/onboarding/BusinessProfileForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { learnResponseSchema } from "@/lib/learn/schemas";
import { onboardingUploadResponseSchema } from "@/lib/onboarding/api-schemas";
import type { ImportResult } from "@/lib/onboarding/import";
import { CONTRACT_FILES } from "@/lib/onboarding/schemas";

type Step = "upload" | "profile";

const EXPECTED = new Set(CONTRACT_FILES);
const baseName = (f: File): string => (f.name.split(/[\\/]/).pop() ?? f.name).toLowerCase();

export default function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("upload");
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function runLearn() {
    const learnRes = await fetch("/api/learn", { method: "POST" });
    const learnJson: unknown = await learnRes.json();
    const learnParsed = learnResponseSchema.safeParse(learnJson);
    if (!learnRes.ok || !learnParsed.success || !("success" in learnParsed.data && learnParsed.data.success)) {
      const message =
        learnParsed.success && "error" in learnParsed.data ? learnParsed.data.error : "Analysis failed";
      throw new Error(message);
    }
    router.push("/onboarding/report");
  }

  function submitUpload() {
    if (matched.length === 0) {
      setError("No matching CSVs found — expected files named like orders.csv, products.csv …");
      return;
    }
    const fd = new FormData();
    matched.forEach(([name, file]) => fd.append(name, file));
    startTransition(async () => {
      try {
        setUploading(true);
        const res = await fetch("/api/onboarding/upload", { method: "POST", body: fd });
        const uploadJson: unknown = await res.json();
        const uploadParsed = onboardingUploadResponseSchema.safeParse(uploadJson);
        if (!uploadParsed.success) {
          setError("Upload failed");
          return;
        }
        if ("error" in uploadParsed.data) {
          setError(uploadParsed.data.error);
          return;
        }
        if (!uploadParsed.data.success) {
          setError("Upload failed");
          return;
        }
        setResults(uploadParsed.data.results);
        setStep("profile");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    });
  }

  const uploadLabel = pending
    ? uploading
      ? "Uploading…"
      : "Working…"
    : `Upload${matched.length ? ` · ${matched.length} file${matched.length === 1 ? "" : "s"}` : ""}`;

  if (step === "profile") {
    return (
      <div className="space-y-4">
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
          onSaved={async () => {
            setError(null);
            await runLearn();
          }}
        />
        {error && <p className="text-sm text-sev-critical">{error}</p>}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <p className="text-xs text-muted-foreground">
          Drop all your CSV exports here (or click to choose). We match each file to its table by name. This
          replaces any existing data and starts a fresh slate (no incidents until you play the stream).
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
            Select all {CONTRACT_FILES.length} at once — we&apos;ll figure out which is which
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

        <Button onClick={() => submitUpload()} disabled={pending || matched.length === 0}>
          {uploadLabel}
        </Button>

        {error && <p className="text-sm text-sev-critical">{error}</p>}
      </CardContent>
    </Card>
  );
}
