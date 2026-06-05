import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import AuthForm from "@/components/auth/AuthForm";
import DemoLoginButton from "@/components/auth/DemoLoginButton";
import OAuthButtons from "@/components/auth/OAuthButtons";
import ShopifyLoginButton from "@/components/auth/ShopifyLoginButton";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Hugo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Commerce Incident Response</p>
      </div>
      <AuthForm title="Create account" action={signUp} />
      <OAuthButtons />
      <ShopifyLoginButton />
      <DemoLoginButton />
      <p className="text-sm text-muted-foreground">
        <Link href="/sign-in" className="text-primary hover:underline">
          Already have an account? Sign in
        </Link>
      </p>
    </div>
  );
}
