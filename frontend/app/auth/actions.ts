"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { resolveDemoCredentials } from "@/lib/auth/demo";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { createOrganizationWithOwner } from "@/lib/organizations";
import { createAdminClient } from "@/lib/supabase/admin";
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

function orgSlugFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "store";
  const base =
    local
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "store";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function signIn(formData: FormData) {
  const parsed = readCredentials(formData);
  if (!parsed.success) {
    return { ok: false as const, error: "Enter a valid email and password (8+ characters)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false as const, error: error.message };

  redirect(safeRedirectPath(formData.get("next")));
}

export async function signUp(formData: FormData) {
  const parsed = readCredentials(formData);
  if (!parsed.success) {
    return { ok: false as const, error: "Enter a valid email and password (8+ characters)." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      // New accounts go straight to onboarding — both when a session is created
      // immediately (the redirect below) and after email confirmation (the
      // callback reads ?next), so account creation always lands on /onboarding.
      emailRedirectTo: `${appUrl()}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { ok: false as const, error: error.message };

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return {
      ok: false as const,
      error: "An account with this email already exists. Try signing in instead.",
    };
  }

  if (!data.session) {
    const userId = data.user?.id;
    if (userId) {
      const storeName = `${parsed.data.email.split("@")[0] ?? "My"}'s store`;
      const admin = createAdminClient();
      try {
        await createOrganizationWithOwner(admin, {
          userId,
          name: storeName,
          slug: orgSlugFromEmail(parsed.data.email),
        });
      } catch (orgErr) {
        const message = orgErr instanceof Error ? orgErr.message : "Failed to create organization";
        return { ok: false as const, error: message };
      }
    }
    return {
      ok: true as const,
      message: `Account created. Check ${parsed.data.email} for a confirmation link to finish signing in.`,
    };
  }

  const userId = data.user?.id;
  if (!userId) {
    return {
      ok: false as const,
      error: "Account created but organization setup failed. Sign in and try again.",
    };
  }

  const storeName = `${parsed.data.email.split("@")[0] ?? "My"}'s store`;
  const admin = createAdminClient();
  try {
    await createOrganizationWithOwner(admin, {
      userId,
      name: storeName,
      slug: orgSlugFromEmail(parsed.data.email),
    });
  } catch (orgErr) {
    const message = orgErr instanceof Error ? orgErr.message : "Failed to create organization";
    return { ok: false as const, error: message };
  }

  redirect("/onboarding");
}

export async function signInAsDemo() {
  const credentials = resolveDemoCredentials();
  if (!credentials) {
    redirect("/sign-in?error=demo");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) {
    redirect("/sign-in?error=demo");
  }

  redirect("/catalog");
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
