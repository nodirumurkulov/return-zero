import {
  InvestigationPreview,
  MarketingKanbanPreview,
} from "@/components/marketing/InvestigationPreview";
import { SectionLabel } from "@/components/ui/section-label";

export function FeaturesSection({ id = "features" }: { id?: string }) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-border py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionLabel>Product</SectionLabel>
        <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          One loop from breach to recovery
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Math finds the breach. Agents explain it. Humans approve the fix. Hugo monitors until the
          incident resolves.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground">Incidents board</p>
            <MarketingKanbanPreview />
          </div>
          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground">AI investigation</p>
            <InvestigationPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
