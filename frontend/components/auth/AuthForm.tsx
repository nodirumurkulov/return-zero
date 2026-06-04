"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state?.ok === false ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Please wait…" : title}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
