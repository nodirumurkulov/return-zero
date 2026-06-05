import {
  onboardingConnectPartialResponseSchema,
  onboardingConnectSuccessResponseSchema,
} from "@/lib/onboarding/api-schemas";

export type StorePlatform = "mock_csv" | "shopify";

export type PostConnectStoreResult = {
  readonly results: Array<{ table: string; count: number; error?: string }>;
};

const connectResponseSchema = onboardingConnectSuccessResponseSchema.or(
  onboardingConnectPartialResponseSchema,
);

async function parseConnectResponse(res: Response): Promise<PostConnectStoreResult> {
  const json: unknown = await res.json();
  const parsed = connectResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Connect failed");
  if (!parsed.data.success) throw new Error("Connect failed");
  return { results: parsed.data.results };
}

export async function postConnectMockStore(): Promise<PostConnectStoreResult> {
  const res = await fetch("/api/stores/connect/mock", { method: "POST" });
  return parseConnectResponse(res);
}

export async function postConnectShopifyStore(): Promise<PostConnectStoreResult> {
  const res = await fetch("/api/stores/connect/shopify", { method: "POST" });
  return parseConnectResponse(res);
}
