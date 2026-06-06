import type { Metadata } from "next";
import Link from "next/link";
import { PricingNegotiationChat } from "@/components/marketing/PricingNegotiationChat";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { formatUsdFromCents, getPricingSession, maskEmail, seedOpeningAssistantMessage } from "@/lib/waitlist-pricing";

export const metadata: Metadata = {
  title: "Pricing chat — Hugo",
  description: "Negotiate Hugo Teams or Enterprise pricing after joining the waitlist.",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function WaitlistPricingPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <SectionLabel>Pricing</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Link required</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Open the pricing chat from your waitlist confirmation email, or join the waitlist to start.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/#waitlist">Join the waitlist</Link>
        </Button>
      </div>
    );
  }

  const session = await getPricingSession(token).catch(() => null);
  if (!session) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
        <SectionLabel>Pricing</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Invalid link</h1>
        <p className="mt-3 text-sm text-muted-foreground">This pricing link is invalid.</p>
        <Button className="mt-6" asChild>
          <Link href="/#waitlist">Join the waitlist</Link>
        </Button>
      </div>
    );
  }

  const openingMessage =
    session.messages.length === 0
      ? await seedOpeningAssistantMessage(session.signup.id).catch(() => null)
      : null;

  const messages =
    openingMessage !== null
      ? [
          ...session.messages,
          {
            id: "opening",
            role: "assistant" as const,
            content: openingMessage,
          },
        ]
      : session.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        }));

  return (
    <PricingNegotiationChat
      token={token}
      email={maskEmail(session.signup.email)}
      negotiationStatus={session.signup.negotiation_status}
      selectedTier={session.signup.selected_tier}
      agreedPriceLabel={
        session.signup.agreed_price_cents !== null
          ? formatUsdFromCents(session.signup.agreed_price_cents)
          : null
      }
      initialMessages={messages}
      currentOfferCents={session.signup.offered_price_cents}
    />
  );
}
