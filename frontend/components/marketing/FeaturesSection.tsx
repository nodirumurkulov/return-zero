import { Activity, Bot, Kanban, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title: "Catalog health",
    description: "Return rate, ROAS, stock, and support volume across every SKU with per-product thresholds.",
    icon: Activity,
    status: "Live",
    statusClass: "bg-sev-resolvedBg text-sev-resolved border-sev-resolvedBd",
    colSpan: "sm:col-span-2",
  },
  {
    title: "Incidents kanban",
    description: "From detected to resolved — severity, £ impact, and ownership on one board.",
    icon: Kanban,
    status: "Core",
    statusClass: "bg-primary-subtle text-primary border-primary/30",
    colSpan: "",
  },
  {
    title: "Parallel AI agents",
    description: "Returns, merchandising, marketing, inventory, and forecasting findings in one investigation.",
    icon: Bot,
    status: "AI",
    statusClass: "bg-sev-monitorBg text-sev-medium border-sev-monitorBd",
    colSpan: "",
  },
  {
    title: "Slack approvals",
    description: "Notifications when incidents need attention. Approve low-risk actions from the channel.",
    icon: MessageSquare,
    status: "Optional",
    statusClass: "bg-sev-idleBg text-sev-idle border-sev-idleBd",
    colSpan: "sm:col-span-2",
  },
] as const;

export function FeaturesSection({ id = "features" }: { id?: string }) {
  return (
    <section id={id} className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          One loop from breach to recovery
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Math finds the breach. Agents explain it. Humans approve the fix. Hugo monitors until the
          incident resolves.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={cn(
                  "rounded-xl border border-border bg-card/50 p-6 shadow-card",
                  feature.colSpan,
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-lg border border-border bg-muted/50 p-2">
                    <Icon className="size-5 text-primary" aria-hidden />
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-medium",
                      feature.statusClass,
                    )}
                  >
                    {feature.status}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
