import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/LandingPage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : new URL("http://localhost:3000"),
  title: "Hugo — Commerce Incident Response",
  description:
    "Detect KPI breaches, investigate with AI, approve fixes, and monitor recovery for ecommerce.",
  openGraph: {
    title: "Hugo — Commerce Incident Response",
    description:
      "Engineering has Incident.io. Ecommerce has Hugo.",
    images: [{ url: "/catLogo.png", width: 512, height: 512, alt: "Hugo" }],
  },
};

export default async function MarketingHomePage({
  searchParams,
}: {
  searchParams: Promise<{ waitlist?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/catalog");
  }

  const params = await searchParams;

  return (
    <LandingPage
      displayClassName="font-display"
      waitlistStatus={params.waitlist ?? null}
    />
  );
}
