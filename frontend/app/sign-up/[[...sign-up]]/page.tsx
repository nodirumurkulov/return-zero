import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import AuthForm from "@/components/auth/AuthForm";
import ComingSoonLoginButton from "@/components/auth/ComingSoonLoginButton";
import DemoLoginButton from "@/components/auth/DemoLoginButton";
import OAuthButtons from "@/components/auth/OAuthButtons";
import { MicrosoftIcon, ShopifyIcon } from "@/components/auth/provider-icons";
import { BrandLogo } from "@/components/layout/BrandLogo";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <BrandLogo variant="auth" />
      <AuthForm title="Create account" action={signUp} passwordAutoComplete="new-password" />
      <OAuthButtons />
      <div className="flex w-full max-w-sm flex-col gap-3">
        <ComingSoonLoginButton provider="Microsoft" icon={<MicrosoftIcon />} />
        <ComingSoonLoginButton provider="Shopify" icon={<ShopifyIcon />} />
      </div>
      <DemoLoginButton />
      <p className="text-sm text-muted-foreground">
        <Link href="/sign-in" className="text-primary hover:underline">
          Already have an account? Sign in
        </Link>
      </p>
    </div>
  );
}
