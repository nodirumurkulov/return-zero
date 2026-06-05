"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthState = { ok: false; error: string } | null;

export default function AuthForm({
  title,
  action,
  initialError,
  nextPath,
}: {
  title: string;
  action: (formData: FormData) => Promise<{ ok: false; error: string } | void>;
  initialError?: string | null;
  nextPath?: string | null;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    async (_prev, formData) => {
      const result = await action(formData);
      return result ?? null;
    },
    initialError ? { ok: false, error: initialError } : null,
  );

  return (
    <form
      action={formAction}
      className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
    >
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Email</span>
        <Input id="auth-email" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Password</span>
        <Input
          id="auth-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {state?.ok === false ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Please wait…" : title}
      </Button>
    </form>
  );
}
