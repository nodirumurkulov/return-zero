const BULLETS = [
  "Sizing-driven return crisis on Court Trainer — cold Meta traffic amplifying misfit buys.",
  "UK11/UK12 stockouts downstream as returns flooded the warehouse loop.",
  "Hugo detected the breach, synthesized root cause, and proposed ranked fixes with recovery tracking.",
] as const;

export function DemoStorySection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-sev-criticalBd bg-sev-criticalBg/30 p-8 sm:p-10">
          <div
            aria-hidden
            className="absolute -right-8 -top-8 size-32 rotate-12 border border-sev-critical/20 bg-sev-critical/5"
          />
          <p className="text-xs font-medium uppercase tracking-wider text-sev-critical">
            Demo narrative
          </p>
          <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Court Trainer Return Spike
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            A real incident from the Pretty Fly demo dataset — seeded with agent findings and
            proposed fixes judges can walk through in five minutes.
          </p>
          <ul className="mt-6 space-y-3">
            {BULLETS.map((bullet) => (
              <li key={bullet} className="flex gap-3 text-sm sm:text-base">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
