import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const STATS = [
  {
    value: "5–7",
    unit: "days",
    label: "to spot a conversion or returns breach in spreadsheets",
    href: "#how-it-works",
  },
  {
    value: "4+",
    unit: "tools",
    label: "to correlate returns, ads, inventory, and support",
    href: "/features",
  },
  {
    value: "12",
    unit: "hrs",
    label: "lost in Slack debates without a shared incident timeline",
    href: "/features",
  },
  {
    value: "0",
    unit: "",
    label: "recovery proofs when fixes ship without metric tracking",
    href: "#how-it-works",
  },
] as const;

export function ProblemSection() {
  return (
    <section id="problem" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          The damage is already in the P&amp;L
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Operators still find out late, pull data from siloed tools, and ship fixes without knowing
          if metrics recovered.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group flex min-w-0 flex-col rounded-xl border border-border bg-card/50 p-5 shadow-card transition-[border-color,background-color] hover:border-primary/40 hover:bg-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex items-baseline gap-1 font-mono tabnum">
                <span className="text-3xl font-semibold text-primary">{stat.value}</span>
                {stat.unit ? (
                  <span className="text-sm text-muted-foreground">{stat.unit}</span>
                ) : null}
              </div>
              <p className="mt-3 line-clamp-3 min-w-0 text-sm text-muted-foreground group-hover:text-foreground">
                {stat.label}
              </p>
              <ArrowUpRight
                className="mt-4 size-4 text-muted-foreground group-hover:text-primary"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
