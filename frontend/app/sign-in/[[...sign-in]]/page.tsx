import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import AuthForm from "@/components/auth/AuthForm";
import DemoLoginButton from "@/components/auth/DemoLoginButton";
import OAuthButtons from "@/components/auth/OAuthButtons";
import ShopifyLoginButton from "@/components/auth/ShopifyLoginButton";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { isDemoLoginConfigured } from "@/lib/auth/demo";
import { authNextPathSchema } from "@/lib/auth/schemas";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const authError =
    params.error === "auth"
      ? "Could not complete sign-in. Try again."
      : params.error === "demo"
        ? "Demo login failed. Copy DEMO_USER_* from .env.example into frontend/.env.local and run bun run seed."
        : null;
  const nextParsed = authNextPathSchema.safeParse(params.next);
  const nextPath = nextParsed.success ? nextParsed.data : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <BrandLogo variant="auth" />
      <AuthForm title="Sign in" action={signIn} initialError={authError} nextPath={nextPath} />
      <OAuthButtons />
      <ShopifyLoginButton />
      <DemoLoginButton configured={isDemoLoginConfigured()} />
      <p className="text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/sign-up" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
