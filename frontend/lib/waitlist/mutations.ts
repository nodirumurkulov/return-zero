import { createAdminClient } from "@/lib/supabase/admin";

export type WaitlistInsertResult =
  | { status: "created"; confirmationToken: string }
  | { status: "exists_unconfirmed"; confirmationToken: string }
  | { status: "exists_confirmed" };

export async function insertWaitlistSignup(email: string): Promise<WaitlistInsertResult> {
  const supabase = createAdminClient();
  const normalized = email.trim().toLowerCase();

  const existing = await supabase
    .from("waitlist_signups")
    .select("confirmation_token, confirmed_at")
    .eq("email", normalized)
    .maybeSingle();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  if (existing.data) {
    if (existing.data.confirmed_at) {
      return { status: "exists_confirmed" };
    }
    return {
      status: "exists_unconfirmed",
      confirmationToken: existing.data.confirmation_token,
    };
  }

  const inserted = await supabase
    .from("waitlist_signups")
    .insert({ email: normalized })
    .select("confirmation_token")
    .single();

  if (inserted.error) {
    throw new Error(inserted.error.message);
  }

  return {
    status: "created",
    confirmationToken: inserted.data.confirmation_token,
  };
}

export async function confirmWaitlistSignup(token: string): Promise<"confirmed" | "already" | "invalid"> {
  const supabase = createAdminClient();
  const row = await supabase
    .from("waitlist_signups")
    .select("id, confirmed_at, email")
    .eq("confirmation_token", token)
    .maybeSingle();

  if (row.error) {
    throw new Error(row.error.message);
  }

  if (!row.data) {
    return "invalid";
  }

  if (row.data.confirmed_at) {
    return "already";
  }

  const updated = await supabase
    .from("waitlist_signups")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", row.data.id)
    .select("email")
    .single();

  if (updated.error) {
    throw new Error(updated.error.message);
  }

  return "confirmed";
}

export async function markWelcomeSent(email: string): Promise<void> {
  const supabase = createAdminClient();
  const updated = await supabase
    .from("waitlist_signups")
    .update({ welcome_sent_at: new Date().toISOString() })
    .eq("email", email.trim().toLowerCase());

  if (updated.error) {
    throw new Error(updated.error.message);
  }
}
