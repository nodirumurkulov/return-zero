import { WORKFLOW_STEPS } from "@/components/marketing/fixtures/demo-data";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

export function IncidentWorkflowStrip({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <ol className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-2">
        {WORKFLOW_STEPS.map((step, index) => (
          <li key={step.status} className="flex min-w-0 flex-1 flex-col gap-3 lg:items-center">
            <div className="flex w-full items-center gap-2 lg:flex-col lg:gap-3">
              <StatusBadge status={step.status} />
              {index < WORKFLOW_STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className="hidden h-px flex-1 bg-border lg:block lg:h-8 lg:w-px lg:flex-none"
                />
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground lg:text-center">{step.caption}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function IncidentWorkflowHeader() {
  return (
    <div className="space-y-2">
      <SectionLabel>Incident lifecycle</SectionLabel>
      <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
        How Hugo works
      </h2>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Commerce incident response with the rigor engineering teams expect from production SRE.
      </p>
    </div>
  );
}
