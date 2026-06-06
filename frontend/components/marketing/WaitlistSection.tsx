"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionLabel } from "@/components/ui/section-label";

type FormStatus = "idle" | "loading" | "sent" | "error";

export function WaitlistSection({ initialBanner }: { initialBanner?: string | null }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [banner] = useState<string | null>(initialBanner ?? null);
  const liveRef = useRef<HTMLDivElement>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setStatus("error");
      setError(data.error ?? "Could not join waitlist. Try again.");
      return;
    }

    setStatus("sent");
    setEmail("");
  };

  return (
    <section id="waitlist" className="scroll-mt-20 py-16">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <div className="space-y-1 text-center">
          <SectionLabel>Early access</SectionLabel>
          <h2 className="text-balance text-2xl font-semibold tracking-tight">
            Join the waitlist
          </h2>
          <p className="text-sm text-muted-foreground">
            Get early access to Hugo — commerce incident response before your quarter closes.
          </p>
        </div>

        {banner ? (
          <p
            className="mt-4 rounded-lg border border-primary/30 bg-primary-subtle px-3 py-2 text-center text-sm"
            role="status"
          >
            {banner}
          </p>
        ) : null}

        <div ref={liveRef} aria-live="polite" className="mt-6">
          {status === "sent" ? (
            <p className="rounded-lg border border-sev-resolvedBd bg-sev-resolvedBg px-4 py-3 text-center text-sm text-sev-resolved">
              Check your inbox to confirm your spot…
            </p>
          ) : (
            <form onSubmit={(event) => { void submit(event); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="waitlist-email">Work email</Label>
                <Input
                  id="waitlist-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="you@store.com"
                  value={email}
                  required
                  disabled={status === "loading"}
                  aria-invalid={error ? true : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                />
              </div>
              <Button type="submit" className="w-full" disabled={status === "loading"}>
                {status === "loading" ? "Joining…" : "Join waitlist"}
              </Button>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden
              />
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
