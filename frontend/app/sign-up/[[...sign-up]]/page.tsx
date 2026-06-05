import { SignUp } from "@clerk/nextjs";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#0A0A0A] px-4 py-12">
      <BrandLogo variant="auth" />
      <SignUp
        appearance={clerkAppearance}
        signInUrl="/sign-in"
        forceRedirectUrl="/catalog"
        fallbackRedirectUrl="/catalog"
      />
    </div>
  );
}
