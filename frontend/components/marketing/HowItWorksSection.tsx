import {
  IncidentWorkflowHeader,
  IncidentWorkflowStrip,
} from "@/components/marketing/IncidentWorkflowStrip";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-b border-border bg-muted/20 py-16">
      <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
        <IncidentWorkflowHeader />
        <IncidentWorkflowStrip />
      </div>
    </section>
  );
}
