import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#0A0A0A] px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Resolve
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Commerce Incident Response
        </p>
      </div>
      <SignIn
        appearance={clerkAppearance}
        signUpUrl="/sign-up"
        forceRedirectUrl="/catalog"
        fallbackRedirectUrl="/catalog"
      />
    </div>
  );
}
