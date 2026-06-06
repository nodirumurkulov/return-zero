import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection({ displayClassName }: { displayClassName?: string }) {
  return (
    <section className="relative overflow-hidden pb-20 pt-28 sm:pt-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
          <p className="marketing-reveal mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            Now accepting early access
            <Link href="#waitlist" className="font-medium text-primary hover:underline">
              Join waitlist
              <ArrowRight className="ml-0.5 inline size-3" aria-hidden />
            </Link>
          </p>

          <h1
            className={cn(
              "marketing-reveal marketing-reveal-delay-1 text-balance text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl",
              displayClassName,
            )}
          >
            Engineering has{" "}
            <span translate="no">Incident.io</span>.
            <br />
            Ecommerce has <span translate="no">Hugo</span>.
          </h1>

          <p className="marketing-reveal marketing-reveal-delay-2 mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground lg:mx-0">
            Detect KPI breaches, investigate with AI, approve fixes, and monitor recovery — before
            the damage hits your P&amp;L.
          </p>

          <div className="marketing-reveal marketing-reveal-delay-3 mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Button size="lg" asChild>
              <Link href="#waitlist">Join Waitlist</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/features">See Features</Link>
            </Button>
          </div>
        </div>

        <div className="marketing-reveal marketing-reveal-delay-4 relative mx-auto mt-16 max-w-5xl lg:-mr-8 lg:ml-auto">
          <div
            aria-hidden
            className="absolute -inset-8 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.25),transparent_65%)]"
          />
          <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-pop ring-1 ring-border/50">
            <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2">
              <span className="size-2 rounded-full bg-sev-critical" aria-hidden />
              <span className="size-2 rounded-full bg-sev-high" aria-hidden />
              <span className="size-2 rounded-full bg-sev-resolved" aria-hidden />
              <span className="ml-2 font-mono text-xs text-muted-foreground tabnum">
                catalog · 62 SKUs · 3 incidents open
              </span>
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-3">
              {[
                { label: "Return rate", value: "18.4%", sev: "text-sev-critical" },
                { label: "ROAS", value: "0.82", sev: "text-sev-high" },
                { label: "Stock cover", value: "4d", sev: "text-sev-monitor" },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-card p-4">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={cn("mt-1 font-mono text-2xl font-semibold tabnum", kpi.sev)}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <span translate="no">Hugo</span> is watching Court Trainer
              <span className="rounded-full bg-sev-criticalBg px-2 py-0.5 text-sev-critical">
                Critical
              </span>
            </div>
          </div>
          <Image
            src="/catLogo.png"
            alt=""
            width={48}
            height={48}
            className="absolute -bottom-4 -right-4 hidden rounded-xl border border-border bg-card p-2 shadow-card sm:block"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
