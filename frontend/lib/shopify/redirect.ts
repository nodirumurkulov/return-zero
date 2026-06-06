import { authNextPathSchema } from "@/lib/auth/schemas";

import type { ResolveOAuthRedirectOpts } from "./types";

const DEFAULT_ONBOARDING = "/onboarding";
const DEFAULT_CATALOG = "/catalog";

export function resolveOAuthRedirect(opts: ResolveOAuthRedirectOpts): string {
  const safeReturnTo =
    opts.returnTo != null && authNextPathSchema.safeParse(opts.returnTo).success
      ? opts.returnTo
      : undefined;

  if (safeReturnTo) {
    if (
      opts.intent === "login" &&
      opts.hadShopifyConnection &&
      safeReturnTo === DEFAULT_ONBOARDING
    ) {
      return DEFAULT_CATALOG;
    }
    return safeReturnTo;
  }

  if (opts.intent === "login" && opts.hadShopifyConnection) {
    return DEFAULT_CATALOG;
  }

  return DEFAULT_ONBOARDING;
}
