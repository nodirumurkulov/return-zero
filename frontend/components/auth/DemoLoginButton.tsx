import { signInAsDemo } from "@/app/auth/actions";
import { HugoMark } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";
import { HUGO_MOCK_STORE_NAME } from "@/lib/organizations/mock-store";

export default function DemoLoginButton() {
  return (
    <form action={signInAsDemo} className="w-full max-w-sm">
      <Button type="submit" size="lg" className="w-full gap-2">
        <HugoMark size={20} className="shadow-none" />
        Continue with {HUGO_MOCK_STORE_NAME}
      </Button>
    </form>
  );
}
