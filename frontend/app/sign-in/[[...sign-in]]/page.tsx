import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import AuthForm from "@/components/auth/AuthForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const authError = params.error === "auth" ? "Could not complete sign-in. Try again." : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Resolve</h1>
        <p className="mt-1 text-sm text-muted-foreground">Commerce Incident Response</p>
      </div>
      <AuthForm title="Sign in" action={signIn} initialError={authError} />
      <p className="text-sm text-muted-foreground">
        <Link href="/sign-up" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
