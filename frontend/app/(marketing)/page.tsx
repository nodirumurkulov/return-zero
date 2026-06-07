import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HugoLanding } from "@/components/marketing/HugoLanding";
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
    description: "Engineering has Incident.io. Ecommerce has Hugo.",
    images: [{ url: "/catLogo.png", width: 512, height: 512, alt: "Hugo" }],
  },
};

export default async function MarketingHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/catalog");
  }

  return <HugoLanding />;
}
