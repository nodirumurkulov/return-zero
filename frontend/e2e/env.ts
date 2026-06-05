export function requireSupabaseEnv(): {
  url: string;
  serviceRoleKey: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "E2E requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment. " +
        "Locally: `supabase start` then export vars from `supabase status -o env` or use frontend/.env.local.",
    );
  }
  return { url, serviceRoleKey };
}
