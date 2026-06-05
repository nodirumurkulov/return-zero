import {
  onboardingConnectBodySchema,
  onboardingConnectResponseSchema,
} from "@/lib/onboarding/api-schemas";
import type { LoadResult, StorePlatform } from "@/lib/stores/connect";

export type PostConnectStoreInput = {
  readonly platform: StorePlatform;
};

export type PostConnectStoreResult = {
  readonly results: LoadResult[];
};

export async function postConnectStore(input: PostConnectStoreInput): Promise<PostConnectStoreResult> {
  const res = await fetch("/api/onboarding/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(onboardingConnectBodySchema.parse(input)),
  });
  const json: unknown = await res.json();
  const parsed = onboardingConnectResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Connect failed");
  if ("error" in parsed.data) throw new Error(parsed.data.error);
  if (!parsed.data.success) throw new Error("Connect failed");
  return { results: parsed.data.results };
}
