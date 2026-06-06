import { Instrument_Serif } from "next/font/google";
import { MarketingAtmosphere } from "@/components/marketing/MarketingAtmosphere";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { SkipLink } from "@/components/marketing/SkipLink";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingAtmosphere className={instrumentSerif.variable}>
      <SkipLink />
      <MarketingNav />
      <main id="main" className="scroll-mt-24">
        {children}
      </main>
      <MarketingFooter />
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .marketing-reveal {
            animation: marketing-fade-up 0.7s ease-out both;
          }
          .marketing-reveal-delay-1 { animation-delay: 0.1s; }
          .marketing-reveal-delay-2 { animation-delay: 0.2s; }
          .marketing-reveal-delay-3 { animation-delay: 0.3s; }
          .marketing-reveal-delay-4 { animation-delay: 0.45s; }
          @keyframes marketing-fade-up {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        }
        .font-display {
          font-family: var(--font-display), ui-serif, Georgia, serif;
        }
      `}</style>
    </MarketingAtmosphere>
  );
}
