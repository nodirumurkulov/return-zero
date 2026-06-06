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
      <main id="main" className="scroll-mt-20">
        {children}
      </main>
      <MarketingFooter />
      <style>{`
        .font-display {
          font-family: var(--font-display), ui-serif, Georgia, serif;
        }
      `}</style>
    </MarketingAtmosphere>
  );
}
