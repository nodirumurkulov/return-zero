import { signInAsDemo } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

function PrettyFlyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none">
      <path
        d="M3 9.5 5 4h14l2 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3 9.5h18v2a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M5 14.5V20h14v-5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DemoLoginButton({ configured }: { configured: boolean }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <form action={signInAsDemo} className="w-full">
        <Button type="submit" size="lg" className="w-full gap-2" disabled={!configured}>
          <PrettyFlyIcon />
          Continue as Pretty Fly
        </Button>
      </form>
      {!configured ? (
        <p className="text-center text-xs text-muted-foreground">
          Set <code className="text-foreground">DEMO_USER_EMAIL</code> and{" "}
          <code className="text-foreground">DEMO_USER_PASSWORD</code> in{" "}
          <code className="text-foreground">frontend/.env.local</code> (see{" "}
          <code className="text-foreground">.env.example</code>), then run{" "}
          <code className="text-foreground">bun run seed</code>.
        </p>
      ) : null}
    </div>
  );
}
