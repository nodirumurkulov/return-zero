import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

import type { shopifyOAuthIntentSchema } from "./schemas";
import type { OAuthStateCookie } from "./state";

export type ShopifyOAuthIntent = z.infer<typeof shopifyOAuthIntentSchema>;

export type BeginOAuthOpts = {
  query: Record<string, string | undefined>;
  sessionUserId?: string | null;
  callbackUrl: string;
};

export type BeginOAuthResult =
  | { action: "authorize"; authorizeUrl: string; cookie: OAuthStateCookie }
  | { action: "redirect"; url: string }
  | { action: "error"; message: string; status: number };

export type CompleteOAuthOpts = {
  query: Record<string, string | undefined>;
  stateCookieValue?: string;
  sessionUserId?: string | null;
  routeClient: SupabaseClient<Database>;
  scheduleBackgroundSync: (fn: () => Promise<void>) => void;
};

export type CompleteOAuthResult =
  | { action: "redirect"; url: string; clearOAuthState?: boolean }
  | { action: "error"; message: string; status: number };

export type ResolveOAuthRedirectOpts = {
  returnTo?: string;
  hadShopifyConnection: boolean;
  intent: ShopifyOAuthIntent;
};
