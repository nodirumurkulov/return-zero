import { type OAuthProvider, signInWithProvider } from "@/app/auth/actions";
import { GoogleIcon } from "@/components/auth/provider-icons";
import { Button } from "@/components/ui/button";

const PROVIDERS: ReadonlyArray<{
  id: OAuthProvider;
  label: string;
  icon: React.ReactNode;
}> = [{ id: "google", label: "Continue with Google", icon: <GoogleIcon /> }];

export default function OAuthButtons() {
  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid gap-2">
        {PROVIDERS.map(({ id, label, icon }) => (
          <form key={id} action={signInWithProvider.bind(null, id)}>
            <Button type="submit" variant="outline" size="lg" className="w-full gap-2">
              {icon}
              {label}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
