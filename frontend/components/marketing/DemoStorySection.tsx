import { MARKETING_HERO_INCIDENTS } from "@/components/marketing/fixtures/demo-data";
import { ConfidenceBar } from "@/components/ui/confidence-bar";
import { ImpactTag } from "@/components/ui/ImpactTag";
import { SectionLabel } from "@/components/ui/section-label";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";

const BULLETS = [
  "Sizing-driven return crisis on Court Trainer — cold Meta traffic amplifying misfit buys.",
  "UK11/UK12 stockouts downstream as returns flooded the warehouse loop.",
  "Hugo detected the breach, synthesized root cause, and proposed ranked fixes with recovery tracking.",
] as const;

export function DemoStorySection() {
  const incident = MARKETING_HERO_INCIDENTS[0];

  return (
    <section className="border-b border-border py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <article className="rounded-lg border border-sev-criticalBd bg-sev-criticalBg/15 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel className="text-sev-critical">Demo incident</SectionLabel>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>

          <h2 className="mt-3 text-balance text-xl font-semibold tracking-tight sm:text-2xl">
            {incident.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <ImpactTag amount={incident.impact_amount} label={incident.impact_label} />
            <span className="font-mono text-xs text-muted-foreground tabnum">
              opened {new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-6, "hour")}
            </span>
          </div>

          {incident.root_cause ? (
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{incident.root_cause}</p>
          ) : null}

          {incident.root_cause_confidence != null ? (
            <ConfidenceBar value={incident.root_cause_confidence} className="mt-4 max-w-sm" />
          ) : null}

          <ul className="mt-6 space-y-2 border-t border-sev-criticalBd/60 pt-6">
            {BULLETS.map((bullet) => (
              <li key={bullet} className="text-sm text-muted-foreground">
                {bullet}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
