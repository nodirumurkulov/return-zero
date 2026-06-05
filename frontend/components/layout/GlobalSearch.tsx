"use client";

import { LayoutGrid, Search, Siren } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { SearchTarget } from "@/lib/search";

function TargetIcon({ kind }: { kind: SearchTarget["kind"] }) {
  if (kind === "incident") {
    return <Siren className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
  }
  return <LayoutGrid className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
}

export default function GlobalSearch({ targets }: { targets: SearchTarget[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    if (!desktop) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("global-search-input")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = normalized
      ? targets.filter(
          (target) =>
            target.label.toLowerCase().includes(normalized) ||
            target.id.toLowerCase().includes(normalized),
        )
      : targets;
    return matches.slice(0, 12);
  }, [query, targets]);

  function select(target: SearchTarget) {
    setOpen(false);
    setQuery("");
    router.push(target.href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-8 w-full items-center rounded-lg border border-input bg-transparent pl-9 pr-16 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label="Search products or incidents"
      >
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
          aria-hidden
        />
        Search products or incidents…
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="top" className="mx-auto mt-16 max-w-lg rounded-xl border p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="sr-only">Search products and incidents</SheetTitle>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="global-search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products or incidents…"
                className="pl-9"
              />
            </div>
          </SheetHeader>
          <ul className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matches
              </li>
            ) : (
              filtered.map((target) => (
                <li key={`${target.kind}-${target.id}`}>
                  <button
                    type="button"
                    onClick={() => select(target)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <TargetIcon kind={target.kind} />
                    <span className="min-w-0 flex-1 truncate">{target.label}</span>
                    <span className="shrink-0 text-xs capitalize text-muted-foreground">
                      {target.kind}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
