import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import AuthForm from "@/components/auth/AuthForm";
import ComingSoonLoginButton from "@/components/auth/ComingSoonLoginButton";
import OAuthButtons from "@/components/auth/OAuthButtons";
import { MicrosoftIcon } from "@/components/auth/provider-icons";
import ShopifyLoginButton from "@/components/auth/ShopifyLoginButton";
import { BrandLogo } from "@/components/layout/BrandLogo";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { authNextPathSchema } from "@/lib/auth/schemas";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const authError =
    params.error === "auth" ? "Could not complete sign-in. Try again." : null;
  const nextParsed = authNextPathSchema.safeParse(params.next);
  const nextPath = nextParsed.success ? nextParsed.data : null;

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <BrandLogo variant="auth" />
      <AuthForm title="Sign in" action={signIn} initialError={authError} nextPath={nextPath} />
      <OAuthButtons />
      <div className="flex w-full max-w-sm flex-col gap-3">
        <ComingSoonLoginButton provider="Microsoft" icon={<MicrosoftIcon />} />
        <ShopifyLoginButton />
      </div>
      <p className="text-sm text-muted-foreground">
        Want early access?{" "}
        <Link href="/#waitlist" className="text-primary hover:underline">
          Join the waitlist
        </Link>
      </p>
    </div>
  );
}
