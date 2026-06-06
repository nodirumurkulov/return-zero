import { CheckCircle2, LineChart, ShieldCheck, Sparkles } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Detect",
    description: "Deterministic rules flag KPI breaches across your catalog and open an incident.",
    icon: LineChart,
    benefits: ["Thresholds per SKU", "£ impact estimate", "Severity scoring"],
  },
  {
    step: "02",
    title: "Investigate",
    description: "Parallel AI agents pull evidence from returns, ads, inventory, and support data.",
    icon: Sparkles,
    benefits: ["Root cause synthesis", "Ranked actions", "Shared timeline"],
  },
  {
    step: "03",
    title: "Approve",
    description: "Humans stay in the loop — review findings and approve fixes before anything ships.",
    icon: ShieldCheck,
    benefits: ["Low-risk Slack approve", "Audit trail", "Owner assignment"],
  },
  {
    step: "04",
    title: "Recover",
    description: "Hugo monitors the metric until it returns to baseline and closes the incident.",
    icon: CheckCircle2,
    benefits: ["Recovery tracking", "Resolved status", "Learn for next time"],
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-y border-border/60 bg-card/20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          How Hugo works
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Commerce incident response with the rigor engineering teams expect from production SRE.
        </p>

        <ol className="mt-12 grid gap-6 lg:grid-cols-2">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.step}
                className="rounded-xl border border-border bg-background/60 p-6 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-primary tabnum">{item.step}</span>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="size-4 text-primary" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
                <ul className="mt-4 space-y-1">
                  {item.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-3.5 shrink-0 text-primary" aria-hidden />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
