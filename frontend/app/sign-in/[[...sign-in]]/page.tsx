import { SignIn } from "@clerk/nextjs";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#0A0A0A] px-4 py-12">
      <BrandLogo variant="auth" />
      <SignIn
        appearance={clerkAppearance}
        signUpUrl="/sign-up"
        forceRedirectUrl="/catalog"
        fallbackRedirectUrl="/catalog"
      />
    </div>
  );
}
