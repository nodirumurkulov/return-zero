"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { AUTH_NEXT_DEFAULT, authNextPathSchema } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type OAuthProvider = "google";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function readCredentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function signIn(formData: FormData) {
  const parsed = readCredentials(formData);
  if (!parsed.success) {
    return { ok: false as const, error: "Enter a valid email and password (8+ characters)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false as const, error: error.message };

  const nextParsed = authNextPathSchema.safeParse(formData.get("next"));
  redirect(nextParsed.success ? nextParsed.data : AUTH_NEXT_DEFAULT);
}

export async function signUp(_formData: FormData) {
  await Promise.resolve();
  return {
    ok: false as const,
    error: "Public sign-up is closed. Join the waitlist or sign in if you already have access.",
  };
}

export async function signInWithProvider(provider: OAuthProvider) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${appUrl()}/auth/callback` },
  });
  if (error || !data.url) {
    redirect("/sign-in?error=auth");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
