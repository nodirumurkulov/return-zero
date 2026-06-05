import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import AppShell from "@/components/layout/AppShell";
import QueryProvider from "@/components/providers/QueryProvider";
import { listSearchTargets } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hugo",
  description: "Commerce Incident Response Platform",
  icons: {
    icon: "/catLogo.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const shellUser = user
    ? {
        id: user.id,
        email: user.email ?? null,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      }
    : null;

  const searchTargets = shellUser
    ? await listSearchTargets(supabase).catch(() => [])
    : [];

  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <QueryProvider>
          {shellUser ? (
            <AppShell user={shellUser} searchTargets={searchTargets}>
              {children}
            </AppShell>
          ) : (
            children
          )}
        </QueryProvider>
      </body>
    </html>
  );
}
