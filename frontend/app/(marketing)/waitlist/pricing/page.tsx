import type { Metadata } from "next";
import Link from "next/link";
import { PricingNegotiationChat } from "@/components/marketing/PricingNegotiationChat";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import {
  formatUsdFromCents,
  lookupPricingSession,
  maskEmail,
  seedOpeningAssistantMessage,
} from "@/lib/waitlist-pricing";

export const metadata: Metadata = {
  title: "Pricing chat — Hugo",
  description: "Negotiate Hugo Teams or Enterprise pricing after joining the waitlist.",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

function PricingErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center sm:px-6">
      <SectionLabel>Pricing</SectionLabel>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      <Button className="mt-6" asChild>
        <Link href="/#waitlist">Join the waitlist</Link>
      </Button>
    </div>
  );
}

export default async function WaitlistPricingPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <PricingErrorState
        title="Link required"
        description="Open the pricing chat from your waitlist confirmation email, or join the waitlist to start."
      />
    );
  }

  const lookup = await lookupPricingSession(token);

  if (lookup.status === "not_found") {
    return (
      <PricingErrorState
        title="Invalid link"
        description="This pricing link is invalid."
      />
    );
  }

  if (lookup.status === "error") {
    const description =
      process.env.NODE_ENV === "development"
        ? lookup.message
        : "Something went wrong loading your pricing chat. Try again in a moment or join the waitlist again.";
    return <PricingErrorState title="Could not load pricing chat" description={description} />;
  }

  const { session } = lookup;

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
