import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import AuthForm from "@/components/auth/AuthForm";
import DemoLoginButton from "@/components/auth/DemoLoginButton";
import OAuthButtons from "@/components/auth/OAuthButtons";
import ShopifyLoginButton from "@/components/auth/ShopifyLoginButton";
import { BrandLogo } from "@/components/layout/BrandLogo";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { isDemoLoginConfigured } from "@/lib/auth/demo";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <BrandLogo variant="auth" />
      <AuthForm title="Create account" action={signUp} />
      <OAuthButtons />
      <ShopifyLoginButton />
      <DemoLoginButton configured={isDemoLoginConfigured()} />
      <p className="text-sm text-muted-foreground">
        <Link href="/sign-in" className="text-primary hover:underline">
          Already have an account? Sign in
        </Link>
      </p>
    </div>
  );
}
