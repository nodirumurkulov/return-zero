import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import QueryProvider from "@/components/providers/QueryProvider";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hugo",
  description: "Commerce Incident Response Platform",
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

  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {shellUser ? <AppShell user={shellUser}>{children}</AppShell> : children}
        </QueryProvider>
      </body>
    </html>
  );
}
