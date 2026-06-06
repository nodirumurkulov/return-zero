import { DemoStorySection } from "@/components/marketing/DemoStorySection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { IntegrationsStrip } from "@/components/marketing/IntegrationsStrip";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { WaitlistSection } from "@/components/marketing/WaitlistSection";

const BANNER_MESSAGES: Record<string, string> = {
  confirmed: "Email confirmed — you're on the Hugo waitlist.",
  already: "You're already confirmed on the waitlist.",
  invalid: "That confirmation link is invalid or expired.",
};

export function LandingPage({
  displayClassName,
  waitlistStatus,
}: {
  displayClassName?: string;
  waitlistStatus?: string | null;
}) {
  const banner =
    waitlistStatus && BANNER_MESSAGES[waitlistStatus]
      ? BANNER_MESSAGES[waitlistStatus]
      : null;

  return (
    <>
      <HeroSection displayClassName={displayClassName} />
      <IntegrationsStrip />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoStorySection />
      <WaitlistSection initialBanner={banner} />
    </>
  );
}
