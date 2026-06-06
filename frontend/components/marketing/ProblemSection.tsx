import { ImpactTag } from "@/components/ui/ImpactTag";
import { SectionLabel } from "@/components/ui/section-label";

const OPS_POINTS = [
  "Spreadsheets surface breaches 5–7 days after revenue already moved.",
  "Returns, ads, inventory, and support live in separate tools — no shared timeline.",
  "Fixes ship in Slack without proof the metric recovered.",
] as const;

export function ProblemSection() {
  return (
    <section id="problem" className="scroll-mt-20 border-b border-border py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_280px]">
        <div>
          <SectionLabel>Why operators switch</SectionLabel>
          <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            The damage is already in the P&amp;L
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Hugo treats commerce KPI breaches like production incidents — with severity, £ impact,
            and recovery proof.
          </p>
          <ul className="mt-6 space-y-3">
            {OPS_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-sm text-muted-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sev-critical" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-lg border border-sev-criticalBd bg-sev-criticalBg/20 p-5">
          <SectionLabel className="text-sev-critical">Typical breach</SectionLabel>
          <p className="mt-3 text-[13px] font-semibold">Court Trainer Return Spike</p>
          <div className="mt-3">
            <ImpactTag amount={24800} label="est. 14d" />
          </div>
          <dl className="mt-5 space-y-3 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Return rate</dt>
              <dd className="font-mono tabnum text-sev-critical">18.4%</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Threshold</dt>
              <dd className="font-mono tabnum">6.5%</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Days to detect (manual)</dt>
              <dd className="font-mono tabnum">5–7</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
