import Link from "next/link";
import { ProductHeroFrame } from "@/components/marketing/ProductHeroFrame";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";

export function HeroSection({ displayClassName }: { displayClassName?: string }) {
  return (
    <section className="border-b border-border pb-16 pt-24 sm:pt-28">
      <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10">
        <div className="max-w-xl">
          <SectionLabel>Commerce incident response</SectionLabel>

          <h1
            className={cn(
              "mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl",
              displayClassName,
            )}
          >
            Engineering has <span translate="no">Incident.io</span>.
            <br />
            Ecommerce has <span translate="no">Hugo</span>.
          </h1>

          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Detect KPI breaches, investigate with AI, approve fixes, and monitor recovery — before
            the damage hits your P&amp;L.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button asChild>
              <Link href="#waitlist">Join waitlist</Link>
            </Button>
            <Link
              href="/features"
              className="text-sm font-medium text-primary hover:underline"
            >
              See features
            </Link>
          </div>
        </div>

        <ProductHeroFrame />
      </div>
    </section>
  );
}
