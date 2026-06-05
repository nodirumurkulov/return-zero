import { ClerkProvider, Show } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resolve",
  description: "Commerce Incident Response Platform",
  icons: {
    icon: "/catLogo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ClerkProvider afterSignOutUrl="/sign-in">
          <Show when="signed-out">{children}</Show>
          <Show when="signed-in">
            <AppShell>{children}</AppShell>
          </Show>
        </ClerkProvider>
      </body>
    </html>
  );
}
