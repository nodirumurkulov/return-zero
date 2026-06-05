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

type AuthResult = { ok: false; error: string } | { ok: true; message: string };
type AuthState = AuthResult | null;

export default function AuthForm({
  title,
  action,
  initialError,
  nextPath,
  passwordAutoComplete = "current-password",
}: {
  title: string;
  action: (formData: FormData) => Promise<AuthResult | void>;
  initialError?: string | null;
  nextPath?: string | null;
  passwordAutoComplete?: "current-password" | "new-password";
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
              autoComplete={passwordAutoComplete}
              required
            />
          </div>
          {state?.ok === false ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          {state?.ok === true ? (
            <Alert>
              <AlertDescription>{state.message}</AlertDescription>
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
