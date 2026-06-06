import type { Metadata } from "next";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";

export const metadata: Metadata = {
  title: "Features — Hugo",
  description: "Catalog health, incidents kanban, AI investigation, and Slack approvals.",
};

export default function FeaturesPage() {
  return (
    <div className="pt-24">
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6">
        <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Built for commerce operators
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Everything you need to run incidents like an SRE team — without leaving the metrics that
          matter to your store.
        </p>
      </div>
      <FeaturesSection id="features-detail" />
      <HowItWorksSection />
    </div>
  );
}
