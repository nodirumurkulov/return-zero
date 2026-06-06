import type { Metadata } from "next";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { SectionLabel } from "@/components/ui/section-label";

export const metadata: Metadata = {
  title: "Features — Hugo",
  description: "Catalog health, incidents kanban, AI investigation, and Slack approvals.",
};

export default function FeaturesPage() {
  return (
    <div className="pt-8">
      <div className="mx-auto max-w-6xl border-b border-border px-4 pb-10 pt-8 sm:px-6">
        <SectionLabel>Features</SectionLabel>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">
          Built for commerce operators
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Run incidents like an SRE team — in the same UI that tracks catalog health and £ impact.
        </p>
      </div>
      <FeaturesSection id="features-detail" />
      <HowItWorksSection />
    </div>
  );
}
