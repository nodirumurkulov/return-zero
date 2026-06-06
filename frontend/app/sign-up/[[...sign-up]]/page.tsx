import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <BrandLogo variant="auth" />
      <div className="w-full max-w-md space-y-4 text-center">
        <h2 className="text-xl font-semibold tracking-tight">Early access only</h2>
        <p className="text-sm text-muted-foreground">
          Hugo is in early access. Join the waitlist and we&apos;ll notify you when your spot
          opens.
        </p>
        <Button size="lg" className="w-full" asChild>
          <Link href="/#waitlist">Join Waitlist</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
